import { useState } from "react";
import { Button } from "@heroui/button";
import { DateRangePicker } from "@heroui/date-picker";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  parseDate,
  CalendarDate,
  getLocalTimeZone,
} from "@internationalized/date";
import { format, startOfWeek, endOfWeek, addDays, subDays } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Image as HerouiImage } from "@heroui/image";

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

// Zod schema for form validation
const formSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .min(3, "El nombre debe tener al menos 3 caracteres"),
  position: z.string().min(1, "El puesto es requerido"),
  start_date: z.custom<CalendarDate>(
    (val) => val !== undefined && val !== null,
    {
      message: "La fecha de inicio es requerida",
    }
  ),
  end_date: z.custom<CalendarDate>((val) => val !== undefined && val !== null, {
    message: "La fecha de fin es requerida",
  }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color hexadecimal inválido"),
  prompt: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres"),
  image: z
    .custom<File>((val) => val === undefined || val instanceof File, {
      message: "Archivo inválido",
    })
    .optional()
    .refine((file) => !file || file.size <= 5 * 1024 * 1024, {
      message: "La imagen no debe superar los 5MB",
    })
    .refine(
      async (file) => {
        if (!file) return true;

        return new Promise<boolean>((resolve) => {
          const img = new Image();
          const url = URL.createObjectURL(file);

          img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img.width === img.height);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(false);
          };
          img.src = url;
        });
      },
      {
        message: "La imagen debe ser cuadrada",
      }
    ),
});

type FormData = z.infer<typeof formSchema>;

export default function IndexPage() {
  const now = new Date();
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [customHex, setCustomHex] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const defaultStartDate = addDays(startOfWeek(now, { weekStartsOn: 0 }), 1);
  const defaultEndDate = subDays(endOfWeek(now, { weekStartsOn: 0 }), 1);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      position: "desarrollador-web",
      start_date: parseDate(format(defaultStartDate, "yyyy-MM-dd")),
      end_date: parseDate(format(defaultEndDate, "yyyy-MM-dd")),
      color: "#FFB6C1",
      prompt: "",
    },
  });

  const selectedColor = watch("color");

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setPdfUrl(null);

    try {
      const formData = new FormData();

      formData.append("name", data.name);
      formData.append("position", data.position);
      formData.append(
        "start_date",
        format(data.start_date.toDate(getLocalTimeZone()), "dd-MM-yyyy")
      );
      formData.append(
        "end_date",
        format(data.end_date.toDate(getLocalTimeZone()), "dd-MM-yyyy")
      );
      formData.append("color", data.color);
      formData.append("prompt", data.prompt);
      if (data.image) {
        formData.append("image", data.image);
      }

      const response = await fetch("http://192.168.194.167:3200/generator", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al generar el reporte");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setPdfUrl(url);
    } catch (error) {
      console.error("Error:", error);

      alert("Error al generar el reporte. Por favor, intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignatureChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file && file.type.startsWith("image/")) {
      // Set file in form
      setValue("image", file, { shouldValidate: true });

      const reader = new FileReader();

      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];

    if (file && file.type.startsWith("image/")) {
      // Set file in form
      setValue("image", file, { shouldValidate: true });

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

        <form
          className="w-full flex flex-col gap-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <Input
                  {...field}
                  isRequired
                  errorMessage={errors.name?.message}
                  isInvalid={!!errors.name}
                  label="Nombre Completo"
                  type="text"
                />
              )}
            />

            <Controller
              control={control}
              name="position"
              render={({ field }) => (
                <Select
                  {...field}
                  isRequired
                  errorMessage={errors.position?.message}
                  isInvalid={!!errors.position}
                  label="Seleccione su puesto"
                  selectedKeys={field.value ? [field.value] : []}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;

                    field.onChange(value);
                  }}
                >
                  {positions.map((position) => (
                    <SelectItem key={position.key}>{position.label}</SelectItem>
                  ))}
                </Select>
              )}
            />
          </div>

          <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
            <Controller
              control={control}
              name="start_date"
              render={({ field }) => (
                <Controller
                  control={control}
                  name="end_date"
                  render={({ field: endField }) => (
                    <DateRangePicker
                      isRequired
                      errorMessage={
                        errors.start_date?.message || errors.end_date?.message
                      }
                      isInvalid={!!errors.start_date || !!errors.end_date}
                      label="Rango de Fechas"
                      value={{
                        start: field.value,
                        end: endField.value,
                      }}
                      onChange={(range) => {
                        if (range) {
                          field.onChange(range.start);
                          endField.onChange(range.end);
                        }
                      }}
                    />
                  )}
                />
              )}
            />

            <Controller
              control={control}
              name="color"
              render={({ field }) => (
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
                    errorMessage={errors.color?.message}
                    isInvalid={!!errors.color}
                    label="Color"
                    value={
                      pastelColors.find((c) => c.value === selectedColor)
                        ?.name || selectedColor
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
                              field.onChange(color.value);
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
                              <span className="text-default-400 text-sm">
                                #
                              </span>
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
                                field.onChange(`#${customHex}`);
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
                                field.onChange(`#${customHex}`);
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
              )}
            />
          </div>

          <Controller
            control={control}
            name="prompt"
            render={({ field }) => (
              <Textarea
                {...field}
                isRequired
                errorMessage={errors.prompt?.message}
                isInvalid={!!errors.prompt}
                label="Descripción de Actividades Realizadas"
                maxRows={6}
                minRows={6}
                placeholder="Describa detalladamente las actividades realizadas durante el período..."
              />
            )}
          />

          <Controller
            control={control}
            name="image"
            render={({ field: { value, onChange, ...field } }) => (
              <div className="w-full">
                <span className="text-sm text-foreground-500 mb-2 block">
                  Firma Digital
                </span>
                <div className="relative">
                  <input
                    {...field}
                    accept="image/*"
                    className="hidden"
                    id="signature-upload"
                    type="file"
                    onChange={handleSignatureChange}
                  />
                  <label
                    className={`flex flex-col items-center justify-center w-full min-h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      isDragging
                        ? "border-primary bg-primary/10"
                        : "border-default-300 hover:border-default-400"
                    }`}
                    htmlFor="signature-upload"
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {signaturePreview ? (
                      <div className="relative w-full h-full p-2 grid place-items-center">
                        <HerouiImage
                          isBlurred
                          alt="Vista previa de firma"
                          className="m-5 pointer-events-none"
                          src={signaturePreview}
                          width={200}
                        />
                        <div className="absolute z-10 inset-0 bg-black/0 hover:bg-black/5 transition-colors rounded-lg flex items-center justify-center" />
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
                          <span className="font-semibold">
                            Click para subir
                          </span>{" "}
                          o arrastre y suelte
                        </p>
                        <p className="text-xs text-default-400">
                          PNG, JPG o JPEG (MAX. 5MB)
                        </p>
                      </div>
                    )}
                  </label>
                  {errors.image && (
                    <p className="text-xs text-danger mt-1">
                      {errors.image.message as string}
                    </p>
                  )}
                </div>
              </div>
            )}
          />

          <div className="justify-end flex flex-row w-full">
            <Button
              color="primary"
              isLoading={isLoading}
              type="submit"
              variant="shadow"
            >
              {isLoading ? "Generando..." : "Generar Reporte"}
            </Button>
          </div>
        </form>

        {pdfUrl && (
          <div className="w-full mt-8">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Reporte Generado
            </h2>
            <div className="w-full border border-default-200 rounded-lg overflow-hidden">
              <iframe
                className="w-full h-[800px]"
                src={pdfUrl}
                title="Reporte PDF"
              />
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <Button
                as="a"
                color="primary"
                download="reporte.pdf"
                href={pdfUrl}
                variant="flat"
              >
                Descargar PDF
              </Button>
              <Button
                color="danger"
                variant="light"
                onClick={() => {
                  if (pdfUrl) {
                    URL.revokeObjectURL(pdfUrl);
                  }
                  setPdfUrl(null);
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </section>
    </DefaultLayout>
  );
}
