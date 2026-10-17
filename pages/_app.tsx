// eslint-disable-next-line import/no-unassigned-import
import "utils/polyfills";
import "components/system/PersonalOS/personal.css";
import { PersonalOSProvider } from "components/system/PersonalOS/context";
import { type AppProps } from "next/app";
import { ErrorBoundary } from "components/pages/ErrorBoundary";
import Metadata from "components/pages/Metadata";
import StyledApp from "components/pages/StyledApp";
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
              <PersonalOSProvider><MenuProvider>
                <Index {...pageProps} />
              </MenuProvider></PersonalOSProvider>
            </StyledApp>
          </ErrorBoundary>
        </SessionProvider>
      </FileSystemProvider>
    </ProcessProvider>
  </ViewportProvider>
);

export default App;
