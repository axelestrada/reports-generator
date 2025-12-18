import { useState } from "react";
import { Button } from "@heroui/button";
import { DateRangePicker } from "@heroui/date-picker";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { parseDate } from "@internationalized/date";
import { format, startOfWeek, endOfWeek, addDays, subDays } from "date-fns";

import { title, subtitle } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

const positions = [
  { key: "desarrollador-web", label: "Desarrollador Web" },
  { key: "coordinador-desarrollo-web", label: "Coordinador de Desarrollo Web" },
  { key: "oficial-soporte", label: "Oficial de Soporte" },
];

const pastelColors = [
  { name: "Rosa", value: "#FFB6C1" },
  { name: "Lavanda", value: "#E6E6FA" },
  { name: "Menta", value: "#B0E0B9" },
  { name: "Durazno", value: "#FFD1B3" },
  { name: "Cielo", value: "#B0D4FF" },
  { name: "Lila", value: "#D4B5FF" },
  { name: "Coral", value: "#FFB3B3" },
  { name: "Limón", value: "#FFFACD" },
  { name: "Aqua", value: "#AFEEEE" },
  { name: "Violeta", value: "#DDA0DD" },
  { name: "Melocotón", value: "#FFDAB9" },
  { name: "Menta Claro", value: "#C1FFC1" },
  { name: "Perla", value: "#FFE4E1" },
  { name: "Celeste", value: "#B0E2FF" },
  { name: "Salmón", value: "#FFB07C" },
];

export default function IndexPage() {
  const now = new Date();
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("#FFB6C1");
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [customHex, setCustomHex] = useState<string>("");

  const defaultStartDate = addDays(startOfWeek(now, { weekStartsOn: 0 }), 1);
  const defaultEndDate = subDays(endOfWeek(now, { weekStartsOn: 0 }), 1);

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10 max-w-3xl mx-auto">
        <div className="inline-block max-w-xl text-center justify-center mb-4">
          <span className={title()}>Generador de&nbsp;</span>
          <span className={title({ color: "violet" })}>Reportes&nbsp;</span>
          <br />
          <span className={subtitle()}>
            Complete el formulario para generar su reporte de actividades
          </span>
        </div>

        <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
          <Input label="Nombre Completo" type="text" />

          <Select
            defaultSelectedKeys={["desarrollador-web"]}
            label="Seleccione su puesto"
          >
            {positions.map((position) => (
              <SelectItem key={position.key}>{position.label}</SelectItem>
            ))}
          </Select>
        </div>

        <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
          <DateRangePicker
            defaultValue={{
              start: parseDate(format(defaultStartDate, "yyyy-MM-dd")),
              end: parseDate(format(defaultEndDate, "yyyy-MM-dd")),
            }}
            label="Rango de Fechas"
          />

          <div className="relative w-full">
            <Input
              readOnly
              endContent={
                <button
                  aria-label="Seleccionar color"
                  className="w-6 h-6 rounded-md border-2 border-default-300 cursor-pointer transition-transform hover:scale-110 shadow-sm"
                  style={{ backgroundColor: selectedColor }}
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
              }
              label="Color"
              value={
                pastelColors.find((c) => c.value === selectedColor)?.name ||
                selectedColor
              }
              onClick={() => setShowColorPicker(!showColorPicker)}
            />
            {showColorPicker && (
              <div className="absolute z-50 mt-2 p-4 bg-content1 rounded-lg shadow-lg border border-default-200 w-full">
                <div className="grid grid-cols-5 gap-3 mb-4">
                  {pastelColors.map((color) => (
                    <button
                      key={color.value}
                      aria-label={`Seleccionar color ${color.name}`}
                      className={`w-full aspect-square rounded-lg transition-all hover:scale-110 hover:shadow-md ${
                        selectedColor === color.value
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-content1 scale-105"
                          : "border-2 border-default-200"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color.value);
                        setShowColorPicker(false);
                      }}
                    />
                  ))}
                </div>
                <div className="border-t border-default-200 pt-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="FFFFFF"
                      size="sm"
                      startContent={
                        <span className="text-default-400 text-sm">#</span>
                      }
                      value={customHex}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/[^0-9A-Fa-f]/g, "")
                          .toUpperCase();

                        setCustomHex(value.slice(0, 6));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && customHex.length === 6) {
                          setSelectedColor(`#${customHex}`);
                          setShowColorPicker(false);
                          setCustomHex("");
                        }
                      }}
                    />
                    <Button
                      color="primary"
                      isDisabled={customHex.length !== 6}
                      size="sm"
                      onClick={() => {
                        if (customHex.length === 6) {
                          setSelectedColor(`#${customHex}`);
                          setShowColorPicker(false);
                          setCustomHex("");
                        }
                      }}
                    >
                      Aplicar
                    </Button>
                  </div>
                  <p className="text-xs text-default-400 mt-2">
                    Ingrese un código hexadecimal sin el #
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Textarea
          label="Descripción de Actividades Realizadas"
          maxRows={6}
          minRows={6}
          placeholder="Describa detalladamente las actividades realizadas durante el período..."
        />

        <div className="w-full">
          <span className="text-sm text-foreground-500 mb-2 block">
            Firma Digital
          </span>
          <div className="relative">
            <input
              accept="image/*"
              className="hidden"
              id="signature-upload"
              type="file"
              onChange={handleSignatureChange}
            />
            <label
              className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-default-300 rounded-lg cursor-pointer hover:border-default-400 transition-colors"
              htmlFor="signature-upload"
            >
              {signaturePreview ? (
                <div className="relative w-full h-full p-2">
                  <img
                    alt="Vista previa de firma"
                    className="w-full h-full object-contain"
                    src={signaturePreview}
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                    <span className="text-sm text-foreground opacity-0 hover:opacity-100 transition-opacity">
                      Cambiar imagen
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-10 h-10 mb-3 text-default-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-default-500">
                    <span className="font-semibold">Click para subir</span> o
                    arrastre y suelte
                  </p>
                  <p className="text-xs text-default-400">
                    PNG, JPG o JPEG (MAX. 5MB)
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="justify-end flex flex-row w-full">
          <Button color="primary" variant="shadow">
            Generar Reporte
          </Button>
        </div>
      </section>
    </DefaultLayout>
  );
}
