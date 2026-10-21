// eslint-disable-next-line next/no-document-import-in-page -- 仅由 _document 导入的服务端 Head 扩展。
import { Head } from "next/document";
import {
  cloneElement,
  type LinkHTMLAttributes,
  type ReactElement,
} from "react";

// 应用样式继续下载，下载完成后由内联控制脚本启用。
class BootHead extends Head {
  public override getCssLinks(
    files: Parameters<Head["getCssLinks"]>[0]
  ): ReturnType<Head["getCssLinks"]> {
    const links = super.getCssLinks(files);
    if (!links) return links;

    return links.map((element) => {
      const link = element as ReactElement<LinkHTMLAttributes<HTMLLinkElement>>;
      return link.props.rel === "stylesheet"
        ? // eslint-disable-next-line react/no-clone-element -- Next 生成的样式链接仅在这里调整加载媒体。
          cloneElement(link, {
            "data-boot-styles": true,
            media: "print",
          } as LinkHTMLAttributes<HTMLLinkElement>)
        : link;
    });
  }
}

export default BootHead;
