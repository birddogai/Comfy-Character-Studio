export const messages = {
  "Characters": {
    "es": "Personajes",
    "zh-CN": "角色"
  },
  "Create": {
    "es": "Crear",
    "zh-CN": "创建"
  },
  "Wardrobe": {
    "es": "Vestuario",
    "zh-CN": "服装"
  },
  "Storyboard": {
    "es": "Guion gráfico",
    "zh-CN": "分镜"
  },
  "Language": {
    "es": "Idioma",
    "zh-CN": "语言"
  },
  "Studio workspaces": {
    "es": "Espacios de trabajo",
    "zh-CN": "工作区"
  },
  "New storyboard": {
    "es": "Nuevo guion gráfico",
    "zh-CN": "新建分镜"
  },
  "New outfit": {
    "es": "Nuevo atuendo",
    "zh-CN": "新建服装"
  },
  "Story": {
    "es": "Historia",
    "zh-CN": "故事"
  },
  "Cast": {
    "es": "Reparto",
    "zh-CN": "角色阵容"
  },
  "What happens?": {
    "es": "¿Qué sucede?",
    "zh-CN": "发生什么？"
  },
  "Original outfit": {
    "es": "Atuendo original",
    "zh-CN": "原始服装"
  },
  "Planned duration": {
    "es": "Duración prevista",
    "zh-CN": "计划时长"
  },
  "Shots": {
    "es": "Planos",
    "zh-CN": "镜头"
  },
  "Frame shape": {
    "es": "Formato del fotograma",
    "zh-CN": "画面比例"
  },
  "Visual style": {
    "es": "Estilo visual",
    "zh-CN": "视觉风格"
  },
  "Advanced settings": {
    "es": "Ajustes avanzados",
    "zh-CN": "高级设置"
  },
  "Generate outfit": {
    "es": "Generar atuendo",
    "zh-CN": "生成服装"
  },
  "Generating…": {
    "es": "Generando…",
    "zh-CN": "正在生成…"
  },
  "Review shots": {
    "es": "Revisar planos",
    "zh-CN": "检查镜头"
  },
  "Upload": {
    "es": "Subir",
    "zh-CN": "上传"
  },
  "Presets": {
    "es": "Preajustes",
    "zh-CN": "预设"
  },
  "Describe": {
    "es": "Describir",
    "zh-CN": "描述"
  },
  "Choose images": {
    "es": "Elegir imágenes",
    "zh-CN": "选择图片"
  },
  "Drop product images here": {
    "es": "Arrastra aquí las imágenes del producto",
    "zh-CN": "将产品图片拖到此处"
  },
  "Use in storyboard": {
    "es": "Usar en el guion gráfico",
    "zh-CN": "用于分镜"
  },
  "Download storyboard": {
    "es": "Descargar guion gráfico",
    "zh-CN": "下载分镜"
  },
  "Edit image": {
    "es": "Editar imagen",
    "zh-CN": "编辑图片"
  },
  "Generate variation": {
    "es": "Generar variante",
    "zh-CN": "生成变体"
  },
  "Repeat with same seed": {
    "es": "Repetir con la misma semilla",
    "zh-CN": "使用相同种子重试"
  },
  "Change photo": {
    "es": "Cambiar foto",
    "zh-CN": "更换图片"
  },
  "Remove": {
    "es": "Quitar",
    "zh-CN": "移除"
  },
  "What is it?": {
    "es": "¿Qué es?",
    "zh-CN": "这是什么？"
  },
  "Add a product photo": {
    "es": "Añadir foto del producto",
    "zh-CN": "添加产品图片"
  },
  "Product reference": {
    "es": "Referencia del producto",
    "zh-CN": "产品参考"
  },
  "Prop or product · optional": {
    "es": "Objeto o producto · opcional",
    "zh-CN": "道具或产品 · 可选"
  },
  "Generate storyboard": {
    "es": "Generar guion gráfico",
    "zh-CN": "生成分镜"
  },
  "Storyboards": {
    "es": "Guiones gráficos",
    "zh-CN": "分镜"
  },
  "Landscape": {
    "es": "Horizontal",
    "zh-CN": "横向"
  },
  "Portrait": {
    "es": "Vertical",
    "zh-CN": "纵向"
  },
  "Social": {
    "es": "Redes sociales",
    "zh-CN": "社交媒体"
  },
  "Square": {
    "es": "Cuadrado",
    "zh-CN": "正方形"
  }
} as const;
export type Locale = "en" | "es" | "zh-CN";
export function translate(locale: Locale, text: string): string {
  if (locale === "en") return text;
  return messages[text as keyof typeof messages]?.[locale] ?? text;
}
