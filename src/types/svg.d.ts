declare module "*.svg" {
  import type { SVGProps } from "react";
  const content: React.ComponentType<SVGProps<SVGSVGElement>>;
  export default content;
}

