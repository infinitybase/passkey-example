import {Passkey} from "bakosafe";
import {createContext, useContext, useEffect, useState} from "react";
import {Provider} from "fuels";

const providerUrl = 'https://testnet.fuel.network/v1/graphql';

enum Pages {
    Auth,
    Faucet,
    Wallet,
}

type PasskeyContextType = {
    passkey: Passkey;
    passkeyId: string | null;
    onConnect: (account: string) => void;
    page: Pages;
    changePage: (page: Pages) => void;
}

const PasskeyContext = createContext<PasskeyContextType>({} as PasskeyContextType);

export const PasskeyProvider = ({children}: { children: React.ReactNode }) => {
    const [passkey, setPasskey] = useState<Passkey | null>(null);
    const [passkeyId, setPasskeyId] = useState<string | null>(null);

    const [page, setPage] = useState<Pages>(Pages.Auth);

    useEffect(() => {
        (async () => {
            const provider = await Provider.create(providerUrl);
            const passkey = new Passkey(provider);
            setPasskey(passkey);
        })();
    }, []);


    if (!passkey) {
        return null;
    }

    return (
        <PasskeyContext.Provider value={{
            page,
            passkey,
            passkeyId,
            changePage: setPage,
            onConnect: setPasskeyId,
        }}>
            {children}
        </PasskeyContext.Provider>
    );
};

export const usePasskey = () => {
    const context = useContext(PasskeyContext);
    return context;
}

export default PasskeyContext;