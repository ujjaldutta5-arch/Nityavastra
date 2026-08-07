"use client";

import { useState } from "react";
import { Plus, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SIZE_PRESETS,
  SIZE_TYPE_LABELS,
  makeVariantSku,
} from "@/lib/size-presets";
import type { ColorOption, ProductVariant, SizeType } from "@/types";

type Props = {
  productId: string;
  sizeType: SizeType;
  sizeOptions: string[];
  colorOptions: ColorOption[];
  variants: ProductVariant[];
  onChange: (next: {
    sizeType: SizeType;
    sizeOptions: string[];
    colorOptions: ColorOption[];
    variants: ProductVariant[];
    has_variants: boolean;
  }) => void;
};

export function VariantMatrixEditor({
  productId,
  sizeType,
  sizeOptions,
  colorOptions,
  variants,
  onChange,
}: Props) {
  const [customSize, setCustomSize] = useState("");
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#7C1F30");

  const setSizeType = (t: SizeType) => {
    const sizes = t === "custom" || t === "none" ? sizeOptions : SIZE_PRESETS[t];
    onChange({
      sizeType: t,
      sizeOptions: t === "none" ? [] : sizes,
      colorOptions,
      variants,
      has_variants: t !== "none" || colorOptions.length > 0 || variants.length > 0,
    });
  };

  const addCustomSize = () => {
    const s = customSize.trim();
    if (!s || sizeOptions.includes(s)) return;
    onChange({
      sizeType: "custom",
      sizeOptions: [...sizeOptions, s],
      colorOptions,
      variants,
      has_variants: true,
    });
    setCustomSize("");
  };

  const addColor = () => {
    const name = colorName.trim();
    if (!name) return;
    if (colorOptions.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    onChange({
      sizeType,
      sizeOptions,
      colorOptions: [...colorOptions, { name, hex: colorHex }],
      variants,
      has_variants: true,
    });
    setColorName("");
  };

  const removeColor = (name: string) => {
    onChange({
      sizeType,
      sizeOptions,
      colorOptions: colorOptions.filter((c) => c.name !== name),
      variants: variants.filter((v) => v.color !== name),
      has_variants: true,
    });
  };

  const autoGenerate = () => {
    const sizes =
      sizeType === "none"
        ? [""]
        : sizeOptions.length
          ? sizeOptions
          : sizeType !== "custom"
            ? SIZE_PRESETS[sizeType as keyof typeof SIZE_PRESETS] || []
            : [];
    const colors = colorOptions.length ? colorOptions : [{ name: "", hex: "#CCCCCC" }];
    const next: ProductVariant[] = [];
    for (const size of sizes) {
      for (const color of colors) {
        const sku = makeVariantSku(productId || "NEW", size || "OS", color.name || "DEF");
        const existing = variants.find(
          (v) => v.size === size && v.color === color.name
        );
        next.push({
          sku: existing?.sku || sku,
          size,
          color: color.name,
          color_hex: color.hex,
          stock: existing?.stock ?? 10,
        });
      }
    }
    onChange({
      sizeType,
      sizeOptions: sizes.filter(Boolean),
      colorOptions,
      variants: next,
      has_variants: next.length > 0,
    });
  };

  const updateVariant = (idx: number, patch: Partial<ProductVariant>) => {
    const next = variants.map((v, i) => (i === idx ? { ...v, ...patch } : v));
    onChange({
      sizeType,
      sizeOptions,
      colorOptions,
      variants: next,
      has_variants: true,
    });
  };

  const removeVariant = (idx: number) => {
    const next = variants.filter((_, i) => i !== idx);
    onChange({
      sizeType,
      sizeOptions,
      colorOptions,
      variants: next,
      has_variants: next.length > 0,
    });
  };

  return (
    <div className="space-y-4" data-testid="variant-matrix-editor">
      <div>
        <Label>Size type</Label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
          value={sizeType}
          onChange={(e) => setSizeType(e.target.value as SizeType)}
          data-testid="product-form-size-type"
        >
          {(Object.keys(SIZE_TYPE_LABELS) as SizeType[]).map((k) => (
            <option key={k} value={k}>
              {SIZE_TYPE_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      {(sizeType === "custom" || sizeType === "none") && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label>Add custom size</Label>
            <Input
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              placeholder="e.g. Petite"
            />
          </div>
          <Button type="button" variant="outline" onClick={addCustomSize}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {sizeOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {sizeOptions.map((s) => (
            <span
              key={s}
              className="rounded-full bg-[#FAF3E7] border border-[#7C1F30]/20 px-2 py-0.5 text-xs"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[120px]">
          <Label>Color name</Label>
          <Input
            value={colorName}
            onChange={(e) => setColorName(e.target.value)}
            placeholder="Crimson"
            data-testid="product-form-color-name"
          />
        </div>
        <div>
          <Label>Swatch</Label>
          <Input
            type="color"
            className="h-9 w-14 p-1"
            value={colorHex}
            onChange={(e) => setColorHex(e.target.value)}
            data-testid="product-form-color-hex"
          />
        </div>
        <Button type="button" variant="outline" onClick={addColor} data-testid="product-form-add-color">
          <Plus className="h-4 w-4 mr-1" /> Color
        </Button>
      </div>

      {colorOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((c) => (
            <button
              key={c.name}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#7C1F30]/20 px-2 py-1 text-xs bg-white"
              onClick={() => removeColor(c.name)}
              title="Remove color"
            >
              <span
                className="h-3 w-3 rounded-full border"
                style={{ backgroundColor: c.hex }}
              />
              {c.name}
              <Trash2 className="h-3 w-3 text-[#7C1F30]" />
            </button>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        onClick={autoGenerate}
        data-testid="product-form-autogen-variants"
      >
        <Wand2 className="h-4 w-4 mr-2" />
        Auto-generate size × color matrix
      </Button>

      {variants.length > 0 && (
        <div className="overflow-x-auto rounded border border-[#7C1F30]/15">
          <table className="w-full text-xs">
            <thead className="bg-[#FAF3E7] text-left">
              <tr>
                <th className="px-2 py-1.5">SKU</th>
                <th className="px-2 py-1.5">Size</th>
                <th className="px-2 py-1.5">Color</th>
                <th className="px-2 py-1.5">Stock</th>
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {variants.map((v, idx) => (
                <tr key={`${v.sku}-${idx}`} className="border-t border-[#7C1F30]/10">
                  <td className="px-2 py-1">
                    <Input
                      className="h-7 text-xs"
                      value={v.sku}
                      onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-1">{v.size || "—"}</td>
                  <td className="px-2 py-1">
                    <span className="inline-flex items-center gap-1">
                      {v.color_hex && (
                        <span
                          className="h-3 w-3 rounded-full border"
                          style={{ backgroundColor: v.color_hex }}
                        />
                      )}
                      {v.color || "—"}
                    </span>
                  </td>
                  <td className="px-2 py-1 w-20">
                    <Input
                      type="number"
                      className="h-7 text-xs"
                      value={v.stock}
                      onChange={(e) =>
                        updateVariant(idx, { stock: Number(e.target.value || 0) })
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => removeVariant(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
