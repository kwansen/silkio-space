// 便签（折角矩形）形状扩展：参照 .examples/flowchart 的 noteShapes 插件，
// 经形状注册表能力键注册自定义 kind "note"，使添加/替换菜单拥有第 7 种形状。
import { SHAPE_REGISTRY_CAPABILITY, Shape } from "silkio-flowchart";
import type { Plugin, ShapeOptions, ShapeStyle } from "silkio-flowchart";

class NoteShape extends Shape {
  constructor(options: ShapeOptions = {}) {
    super("note", { width: 160, height: 99 }, {
      ...options,
      style: { fill: "#fef9c3", stroke: "#ca8a04", ...options.style } as Partial<ShapeStyle>,
    });
  }

  // 内接矩形近似（折角只占右上角一小块）
  protected get textFit() {
    return 1.15;
  }

  protected boundaryT(dx: number, dy: number) {
    const tx = dx === 0 ? Infinity : this.width / 2 / Math.abs(dx);
    const ty = dy === 0 ? Infinity : this.height / 2 / Math.abs(dy);
    return Math.min(tx, ty);
  }

  protected contains(x: number, y: number) {
    return x >= 0 && x <= this.width && y >= 0 && y <= this.height;
  }

  protected drawPath(ctx: CanvasRenderingContext2D) {
    const fold = 18;
    ctx.moveTo(0, 0);
    ctx.lineTo(this.width - fold, 0);
    ctx.lineTo(this.width, fold);
    ctx.lineTo(this.width, this.height);
    ctx.lineTo(0, this.height);
    ctx.closePath();
  }
}

// install 期间经能力键向注册表追加自定义 kind
export const noteShapes: Plugin = {
  install(app) {
    app
      .require(SHAPE_REGISTRY_CAPABILITY)
      .register("note", (o) => new NoteShape(o), { label: "便签" });
  },
};
