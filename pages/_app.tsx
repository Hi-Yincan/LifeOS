// eslint-disable-next-line import/no-unassigned-import
import "utils/polyfills";
// eslint-disable-next-line import/no-unassigned-import -- Global product styles must be imported by Next App.
import "components/system/LifeOS/lifeos.css";
import { type AppProps } from "next/app";
import { ErrorBoundary } from "components/pages/ErrorBoundary";
import Metadata from "components/pages/Metadata";
import StyledApp from "components/pages/StyledApp";
import { LifeOSProvider } from "components/system/LifeOS/context";
import { FileSystemProvider } from "contexts/fileSystem";
import { MenuProvider } from "contexts/menu";
import { ProcessProvider } from "contexts/process";
import { SessionProvider } from "contexts/session";
import { ViewportProvider } from "contexts/viewport";

const App: FC<AppProps> = ({ Component: Index, pageProps }) => (
  <ViewportProvider>
    <ProcessProvider>
      <FileSystemProvider>
        <SessionProvider>
          <ErrorBoundary>
            <Metadata />
            <StyledApp>
              <LifeOSProvider>
                <MenuProvider>
                  <Index {...pageProps} />
                </MenuProvider>
              </LifeOSProvider>
            </StyledApp>
          </ErrorBoundary>
        </SessionProvider>
      </FileSystemProvider>
    </ProcessProvider>
  </ViewportProvider>
);

export default App;
