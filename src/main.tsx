import {Provider} from "@/components/ui/provider"
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {PasskeyProvider} from "@/context/passkey.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Provider>
            <QueryClientProvider client={new QueryClient()}>
                <PasskeyProvider>
                    <App/>
                </PasskeyProvider>
            </QueryClientProvider>
        </Provider>
    </React.StrictMode>,
)