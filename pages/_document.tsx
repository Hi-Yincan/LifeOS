import NextDocument, {
  type DocumentContext,
  type DocumentInitialProps,
  Head,
  Html,
  Main,
  NextScript,
} from "next/document";
import { ServerStyleSheet } from "styled-components";
import BootHead from "components/system/Boot/BootHead";
import BootScreen, { bootStyles } from "components/system/Boot/BootScreen";
import { bootScript } from "components/system/Boot/bootstrap";
import { DEFAULT_LOCALE } from "utils/constants";

const withStyledComponents = async (
  ctx: DocumentContext
): Promise<DocumentInitialProps> => {
  const { renderPage } = ctx;
  const sheet = new ServerStyleSheet();

  try {
    ctx.renderPage = () =>
      renderPage({
        enhanceApp: (App) => (props) => sheet.collectStyles(<App {...props} />),
      });

    const { styles, ...initialProps } = await NextDocument.getInitialProps(ctx);

    return {
      ...initialProps,
      styles: [styles, sheet.getStyleElement()],
    };
  } finally {
    sheet.seal();
  }
};

// eslint-disable-next-line react/prefer-function-component
class Document extends NextDocument {
  public static override async getInitialProps(
    ctx: DocumentContext
  ): Promise<DocumentInitialProps> {
    return withStyledComponents(ctx);
  }

  public override render(): React.JSX.Element {
    const hasBootScreen = this.props.__NEXT_DATA__.page === "/";
    const DocumentHead = hasBootScreen ? BootHead : Head;

    return (
      <Html lang={DEFAULT_LOCALE}>
        <DocumentHead>
          {hasBootScreen && <style>{bootStyles}</style>}
        </DocumentHead>
        <body>
          {hasBootScreen ? (
            <>
              <BootScreen />
              <div aria-hidden="true" id="lifeos-root" inert>
                <Main />
              </div>
              {/* eslint-disable-next-line react/no-danger -- 仅注入仓库内固定启动脚本，不包含用户输入。 */}
              <script dangerouslySetInnerHTML={{ __html: bootScript }} />
            </>
          ) : (
            <Main />
          )}
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default Document;
