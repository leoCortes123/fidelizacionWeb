import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Camera,
  ChefHat,
  ImageIcon,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  useBusinesses,
  useProducts,
  useSetProductCombo,
  useUpsertProduct,
} from "@/features/loyalty/hooks";
import { useBusinessContext } from "@/features/loyalty/businessContext";
import { errorMessage } from "@/lib/errors";
import { formatCOP, parseCopInput } from "@/lib/format";
import { isSupportedImage, uploadBusinessAssetImage } from "@/lib/image";
import { useFormDraft } from "@/lib/useFormDraft";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState, ListSkeleton, LoadingScreen } from "@/components/shared/States";
import type { Business, Product, ProductKind } from "@/types";

const MAX_PRICE_COP = 100_000_000;

const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(120, "El nombre no puede superar 120 caracteres."),
  description: z.string().max(500, "La descripción no puede superar 500 caracteres."),
  priceCop: z
    .number({ invalid_type_error: "Introduce un precio válido." })
    .int("El precio debe ser un número entero de pesos.")
    .min(1, "El precio debe ser mayor que cero.")
    .max(MAX_PRICE_COP, "El precio es demasiado alto."),
  costCop: z
    .number({ invalid_type_error: "Introduce un costo válido." })
    .int("El costo debe ser un número entero de pesos.")
    .min(0, "El costo no puede ser negativo.")
    .max(MAX_PRICE_COP, "El costo es demasiado alto.")
    .nullable(),
  isActive: z.boolean(),
  kind: z.enum(["simple", "combo"]),
});

interface ProductFormState {
  name: string;
  description: string;
  priceCop: string;
  costCop: string;
  isActive: boolean;
  kind: ProductKind;
  comboItems: Record<string, string>;
  imageUrl: string | null;
}

const EMPTY_FORM: ProductFormState = {
  name: "",
  description: "",
  priceCop: "",
  costCop: "",
  isActive: true,
  kind: "simple",
  comboItems: {},
  imageUrl: null,
};

export function ProductsPage() {
  const businesses = useBusinesses();
  const { selectedBusiness, setSelectedBusiness } = useBusinessContext();
  const navigate = useNavigate();

  if (businesses.isLoading) return <ListSkeleton rows={3} />;
  if (businesses.isError) {
    return <ErrorState error={businesses.error} onRetry={() => void businesses.refetch()} />;
  }

  const list = businesses.data ?? [];

  if (list.length > 1 && !selectedBusiness) {
    return (
      <div className="space-y-4 sm:space-y-5 animate-fade-in">
        <PageHeader
          title="Selecciona un negocio"
          description="Elige el negocio cuya carta deseas administrar."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((business) => (
            <Card key={business.id} className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-6 text-center">
                <Package className="mx-auto mb-3 size-12 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">{business.name}</h3>
                <p className="text-xs text-muted-foreground">{business.slug}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => {
                    setSelectedBusiness(business);
                    navigate("/admin/products");
                  }}
                >
                  Seleccionar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const current = selectedBusiness ?? list[0];
  if (!current) {
    return (
      <div className="space-y-4 sm:space-y-5 animate-fade-in">
        <PageHeader title="Sin negocios" description="No tienes negocios asignados." />
        <EmptyState
          title="Sin negocios"
          description="Registra un negocio para administrar su carta."
          icon={Package}
        />
      </div>
    );
  }

  return <ProductsSection key={current.id} business={current} />;
}

function ProductsSection({ business }: { business: Business }) {
  // El panel administrativo necesita ver también los productos inactivos.
  const products = useProducts(business.id, false);
  const upsertProduct = useUpsertProduct();
  const setCombo = useSetProductCombo();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormState, string>>>({});
  const [uploadingIds, setUploadingIds] = useState<Record<string, boolean>>({});
  const [uploadingModalPhoto, setUploadingModalPhoto] = useState(false);
  const modalPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const modalSessionRef = useRef(0);
  const newProductDraft = useFormDraft<ProductFormState>({
    key: `admin:new-product:${business.id}`,
  });

  useEffect(() => {
    if (dialogOpen && !editing) newProductDraft.save(form);
  }, [dialogOpen, editing, form, newProductDraft.save]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = products.data ?? [];
    if (!term) return rows;
    return rows.filter((product) =>
      `${product.name} ${product.description ?? ""}`.toLowerCase().includes(term),
    );
  }, [products.data, search]);

  if (products.isLoading) return <LoadingScreen label="Cargando carta…" />;
  if (products.isError) {
    return <ErrorState error={products.error} onRetry={() => void products.refetch()} />;
  }

  const rows = products.data ?? [];
  const parsedPrice = parseCopInput(form.priceCop);
  const parsedCost = form.costCop.trim() === "" ? null : parseCopInput(form.costCop);
  const costWarning = parsedPrice !== null && parsedCost !== null && parsedCost > parsedPrice;
  const isBusyModal = upsertProduct.isPending || setCombo.isPending || uploadingModalPhoto;
  const comboCandidates = rows.filter(
    (product) =>
      product.kind === "simple" &&
      product.id !== editing?.id &&
      (product.is_active || Boolean(form.comboItems[product.id])),
  );

  function openCreate() {
    modalSessionRef.current += 1;
    setEditing(null);
    setForm({ ...EMPTY_FORM, ...(newProductDraft.read() ?? {}) });
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    modalSessionRef.current += 1;
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description ?? "",
      priceCop: String(product.price_cop),
      costCop: product.cost_cop === null ? "" : String(product.cost_cop),
      isActive: product.is_active,
      kind: product.kind,
      comboItems: Object.fromEntries(
        product.combo_items.map((item) => [item.product_id, String(item.quantity)]),
      ),
      imageUrl: product.image_url ?? null,
    });
    setErrors({});
    setDialogOpen(true);
  }

  function closeModal(clearNewDraft = false) {
    if (isBusyModal) return;
    modalSessionRef.current += 1;
    if (clearNewDraft && !editing) newProductDraft.clear();
    setDialogOpen(false);
    setEditing(null);
  }

  function update<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  }

  async function uploadPhotoFile(file: File, productId?: string | null): Promise<string | null> {
    if (!isSupportedImage(file)) {
      toast.error("Usa una imagen JPEG, PNG o WebP.");
      return null;
    }
    return uploadBusinessAssetImage({
      businessId: business.id,
      folder: productId ? `products/${productId}` : "products/item",
      file,
    });
  }

  async function handleCardPhotoUpload(
    product: Product,
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingIds((previous) => ({ ...previous, [product.id]: true }));
    try {
      const publicUrl = await uploadPhotoFile(file, product.id);
      if (!publicUrl) return;
      await upsertProduct.mutateAsync({
        businessId: business.id,
        id: product.id,
        name: product.name,
        description: product.description,
        priceCop: product.price_cop,
        costCop: product.cost_cop,
        isActive: product.is_active,
        kind: product.kind,
        imageUrl: publicUrl,
      });
      if (editing?.id === product.id) {
        update("imageUrl", publicUrl);
      }
      toast.success("Foto del producto actualizada.");
    } catch (error) {
      toast.error(errorMessage(error) || "No pudimos subir la foto del producto.");
    } finally {
      setUploadingIds((previous) => {
        const next = { ...previous };
        delete next[product.id];
        return next;
      });
    }
  }

  async function handleModalPhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const uploadSession = modalSessionRef.current;
    setUploadingModalPhoto(true);
    try {
      const publicUrl = await uploadPhotoFile(file, editing?.id ?? null);
      if (!publicUrl || modalSessionRef.current !== uploadSession) return;
      update("imageUrl", publicUrl);
      toast.success("Foto cargada. Guarda para aplicar los cambios.");
    } catch (error) {
      if (modalSessionRef.current === uploadSession) {
        toast.error(errorMessage(error) || "No pudimos subir la foto del producto.");
      }
    } finally {
      setUploadingModalPhoto(false);
    }
  }

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault();
    const priceCop = parseCopInput(form.priceCop);
    const costCop = form.costCop.trim() === "" ? null : parseCopInput(form.costCop);

    const parsed = productSchema.safeParse({
      name: form.name,
      description: form.description,
      priceCop: priceCop ?? Number.NaN,
      costCop: costCop,
      isActive: form.isActive,
      kind: form.kind,
    });

    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof ProductFormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ProductFormState | undefined;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      toast.error(parsed.error.issues[0]?.message ?? "Revisa los datos del producto.");
      return;
    }

    try {
      const comboItems = Object.entries(form.comboItems)
        .map(([productId, quantity]) => ({
          product_id: productId,
          quantity: Number(quantity),
        }))
        .filter((item) => Number.isFinite(item.quantity) && item.quantity > 0);

      if (parsed.data.kind === "combo" && comboItems.length === 0) {
        toast.error("Un combo necesita al menos un producto componente.");
        return;
      }

      const wasEditing = Boolean(editing);
      const saved = await upsertProduct.mutateAsync({
        businessId: business.id,
        id: editing?.id ?? null,
        name: parsed.data.name,
        description: parsed.data.description.trim() || null,
        priceCop: parsed.data.priceCop,
        costCop: parsed.data.costCop,
        isActive: parsed.data.isActive,
        kind: parsed.data.kind,
        imageUrl: form.imageUrl,
      });

      if (parsed.data.kind === "combo") {
        // Si fallara `setCombo`, conservar el id recién creado evita duplicarlo al reintentar.
        setEditing(saved);
        await setCombo.mutateAsync({
          businessId: business.id,
          productId: saved.id,
          items: comboItems,
        });
      }

      newProductDraft.clear();
      toast.success(wasEditing ? "Producto actualizado" : "Producto creado");
      modalSessionRef.current += 1;
      setDialogOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function toggleProduct(product: Product) {
    void upsertProduct
      .mutateAsync({
        businessId: business.id,
        id: product.id,
        name: product.name,
        description: product.description,
        priceCop: product.price_cop,
        costCop: product.cost_cop,
        isActive: !product.is_active,
        kind: product.kind,
        imageUrl: product.image_url ?? null,
      })
      .then(() => toast.success(product.is_active ? "Producto desactivado" : "Producto activado"))
      .catch((error) => toast.error(errorMessage(error)));
  }

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5 animate-fade-in">
      <PageHeader
        title="Carta"
        description="Productos que puedes vincular a recompensas y usar para estimar el costo de los canjes."
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden="true" />
            Nuevo producto
          </Button>
        }
      />

      <div className="px-4 sm:px-0">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o descripción"
            className="pl-8"
            aria-label="Buscar productos"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Sin productos en la carta"
          description="Añade tus productos para vincularlos a recompensas y estimar costos."
          icon={Package}
          action={
            <Button variant="outline" onClick={openCreate}>
              Crear producto
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description={`Ningún producto coincide con “${search.trim()}”.`}
          icon={Search}
        />
      ) : (
        <>
          <div className="space-y-3 px-4 sm:px-0 md:hidden" data-testid="products-cards">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isUploading={Boolean(uploadingIds[product.id])}
                isSaving={upsertProduct.isPending}
                onSelect={() => openEdit(product)}
                onUploadPhoto={(event) => void handleCardPhotoUpload(product, event)}
                onToggle={() => toggleProduct(product)}
              />
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-none border md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Producto
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Precio
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Costo
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden border bg-muted/40">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <ImageIcon
                              className="size-4 text-muted-foreground"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 break-words font-semibold">
                            {product.name}
                            {product.kind === "combo" && <Badge variant="secondary">Combo</Badge>}
                          </p>
                          {product.description && (
                            <p className="break-words text-xs text-muted-foreground">
                              {product.description}
                            </p>
                          )}
                          {product.kind === "combo" && product.combo_items.length > 0 && (
                            <p className="break-words text-xs text-muted-foreground">
                              {product.combo_items
                                .map((item) => `${item.quantity} × ${item.name}`)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCOP(product.price_cop)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {product.cost_cop === null ? (
                        <span className="text-muted-foreground">Sin dato</span>
                      ) : (
                        formatCOP(product.cost_cop)
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={product.is_active ? "success" : "muted"}>
                        {product.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(product)}
                          aria-label={`Editar ${product.name}`}
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleProduct(product)}
                          aria-label={
                            product.is_active
                              ? `Desactivar ${product.name}`
                              : `Activar ${product.name}`
                          }
                        >
                          {product.is_active ? (
                            <Trash2 aria-hidden="true" />
                          ) : (
                            <BadgeCheck aria-hidden="true" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="px-4 text-xs text-muted-foreground sm:px-0">
        El costo es <strong>estimado y no contable</strong>: se usa para calcular el costo de las
        recompensas y el presupuesto del programa.
      </p>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (open) setDialogOpen(true);
          else closeModal(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Detalle del producto" : "Nuevo producto"}</DialogTitle>
            <DialogDescription>
              Los productos activos pueden vincularse a recompensas de producto gratis.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveProduct} className="min-w-0 space-y-4" noValidate>
            <div className="space-y-2">
              <Label>Foto del producto (opcional)</Label>
              <div className="flex flex-wrap items-center gap-3 rounded-none border bg-muted/20 p-3">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden border bg-muted/40">
                  {form.imageUrl ? (
                    <img
                      src={form.imageUrl}
                      alt={form.name || "Foto del producto"}
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-6 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={modalPhotoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      tabIndex={-1}
                      aria-label="Subir foto del producto"
                      disabled={uploadingModalPhoto}
                      onChange={(event) => void handleModalPhotoUpload(event)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingModalPhoto}
                      onClick={() => modalPhotoInputRef.current?.click()}
                    >
                      {uploadingModalPhoto ? (
                        <Loader2 className="animate-spin" aria-hidden="true" />
                      ) : (
                        <Camera aria-hidden="true" />
                      )}
                      {uploadingModalPhoto
                        ? "Subiendo…"
                        : form.imageUrl
                          ? "Cambiar foto"
                          : "Cargar foto"}
                    </Button>
                    {form.imageUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={uploadingModalPhoto}
                        onClick={() => update("imageUrl", null)}
                      >
                        Quitar
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG o WebP. Se ajusta automáticamente al subir.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-name">Nombre</Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                maxLength={120}
                required
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && (
                <p className="text-xs font-medium text-destructive" role="alert">
                  {errors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">Descripción (opcional)</Label>
              <Textarea
                id="product-description"
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                maxLength={500}
              />
              {errors.description && (
                <p className="text-xs font-medium text-destructive" role="alert">
                  {errors.description}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-kind">Tipo de producto</Label>
              <Select
                value={form.kind}
                onValueChange={(value) => update("kind", value as ProductKind)}
              >
                <SelectTrigger id="product-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Producto simple</SelectItem>
                  <SelectItem value="combo">Combo (varios productos)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                El precio del combo es el que se cobra; el detalle muestra sus componentes.
              </p>
            </div>

            {form.kind === "combo" && (
              <div className="space-y-2 rounded-none border p-3">
                <Label className="flex items-center gap-2">
                  <ChefHat className="size-4 text-muted-foreground" aria-hidden="true" />
                  Componentes del combo
                </Label>
                {comboCandidates.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Necesitas al menos un producto simple activo en la carta.
                  </p>
                ) : (
                  <ul className="max-h-56 space-y-2 overflow-y-auto">
                    {comboCandidates.map((product) => {
                      const checked = Boolean(form.comboItems[product.id]);
                      return (
                        <li key={product.id} className="flex items-center justify-between gap-2">
                          <label className="flex min-w-0 items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              className="size-4 cursor-pointer rounded-none border-input accent-primary"
                              checked={checked}
                              onChange={(event) => {
                                setForm((current) => {
                                  const next = { ...current.comboItems };
                                  if (event.target.checked) next[product.id] = "1";
                                  else delete next[product.id];
                                  return { ...current, comboItems: next };
                                });
                              }}
                            />
                            <span className="truncate">{product.name}</span>
                          </label>
                          {checked && (
                            <Input
                              type="number"
                              min={1}
                              max={99}
                              className="w-20 shrink-0"
                              aria-label={`Cantidad de ${product.name}`}
                              value={form.comboItems[product.id]}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  comboItems: {
                                    ...current.comboItems,
                                    [product.id]: event.target.value,
                                  },
                                }))
                              }
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="product-price">Precio (COP)</Label>
                <Input
                  id="product-price"
                  inputMode="numeric"
                  placeholder="2.500"
                  value={form.priceCop}
                  onChange={(event) => update("priceCop", event.target.value)}
                  required
                  aria-invalid={Boolean(errors.priceCop)}
                />
                {errors.priceCop ? (
                  <p className="text-xs font-medium text-destructive" role="alert">
                    {errors.priceCop}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {parseCopInput(form.priceCop) !== null
                      ? formatCOP(parseCopInput(form.priceCop)!)
                      : "Precio de venta al público."}
                  </p>
                )}
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="product-cost">Costo (COP, opcional)</Label>
                <Input
                  id="product-cost"
                  inputMode="numeric"
                  placeholder="800"
                  value={form.costCop}
                  onChange={(event) => update("costCop", event.target.value)}
                  aria-invalid={Boolean(errors.costCop)}
                />
                {errors.costCop ? (
                  <p className="text-xs font-medium text-destructive" role="alert">
                    {errors.costCop}
                  </p>
                ) : costWarning ? (
                  <p className="text-xs font-medium text-amber-700" role="status">
                    El costo supera el precio de venta. Verifica el dato: es solo una estimación.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Estimado, no contable.</p>
                )}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => update("isActive", event.target.checked)}
                className="size-4 cursor-pointer rounded-none border-input accent-primary"
              />
              Disponible en la carta
            </label>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => closeModal(true)}
                disabled={isBusyModal}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={upsertProduct.isPending || setCombo.isPending}
                disabled={uploadingModalPhoto}
              >
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Tarjeta móvil para un producto de la carta: al seleccionarla abre su detalle
 * y ofrece un botón separado para cargar o cambiar la foto sin botones anidados.
 */
function ProductCard({
  product,
  isUploading,
  isSaving,
  onSelect,
  onUploadPhoto,
  onToggle,
}: {
  product: Product;
  isUploading: boolean;
  isSaving: boolean;
  onSelect: () => void;
  onUploadPhoto: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggle: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Card variant="tinted" className="overflow-hidden">
      <CardContent className="p-0">
        <button
          type="button"
          onClick={onSelect}
          aria-label={`Ver detalle de ${product.name}`}
          className="flex w-full min-w-0 items-start gap-3 p-4 text-left transition-colors hover:bg-primary/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring dark:hover:bg-primary/[0.14]"
        >
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden border border-primary/20 bg-background/80 dark:border-primary/30 dark:bg-card/80">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-5 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 break-words font-semibold leading-snug">{product.name}</p>
              <span className="shrink-0 whitespace-nowrap font-semibold tabular-nums">
                {formatCOP(product.price_cop)}
              </span>
            </div>
            <p className="line-clamp-2 break-words text-xs text-muted-foreground">
              {product.description?.trim() ? product.description : "Sin descripción"}
            </p>
            {product.kind === "combo" && product.combo_items.length > 0 && (
              <p className="break-words text-xs text-muted-foreground">
                {product.combo_items.map((item) => `${item.quantity} × ${item.name}`).join(" · ")}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <Badge variant={product.is_active ? "success" : "muted"}>
                {product.is_active ? "Activo" : "Inactivo"}
              </Badge>
              {product.kind === "combo" && <Badge variant="secondary">Combo</Badge>}
            </div>
          </div>
        </button>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-primary/15 bg-primary/[0.06] px-4 py-2.5 dark:border-primary/25 dark:bg-primary/[0.14]">
          <div className="min-w-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              tabIndex={-1}
              aria-label={`Archivo de foto para ${product.name}`}
              disabled={isUploading || isSaving}
              onChange={onUploadPhoto}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading || isSaving}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Camera aria-hidden="true" />
              )}
              {isUploading ? "Subiendo…" : product.image_url ? "Cambiar foto" : "Cargar foto"}
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isUploading || isSaving}
            onClick={onToggle}
            aria-label={
              product.is_active ? `Desactivar ${product.name}` : `Activar ${product.name}`
            }
          >
            {product.is_active ? "Desactivar" : "Activar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
