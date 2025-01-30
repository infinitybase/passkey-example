import {ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
    Button,
    Box,
    Flex,
    VStack,
    Text,
    Center,
    Group,
    createIcon,
    IconButton,
    chakra,
    Separator,
    HStack,
    createListCollection, useClipboard, Heading, Input, Field, defineStyle
} from "@chakra-ui/react";
import {EmptyState} from "@/components/ui/empty-state.tsx";
import {StatLabel, StatRoot, StatValueText} from "@/components/ui/stat.tsx";
import {CiLogout} from "react-icons/ci";
import {BiCopy, BiCheck} from "react-icons/bi";
import {Tag} from "@/components/ui/tag.tsx";
import {BN, bn, isB256} from "fuels";
import {usePasskey} from "@/context/passkey.tsx";
import {useMutation, useQuery} from "@tanstack/react-query";
import {Avatar} from "@/components/ui/avatar.tsx";
import {IoMdAdd, IoIosClose} from "react-icons/io";
import {debounce} from "lodash";
import {BakoIDClient, isValidDomain} from "@bako-id/sdk";

function formatAddress(address: string, factor?: number) {
    const size = factor ?? 10;

    if (!address) return;
    return `${address.slice(0, size)}...${address.slice(-4)}`;
}

const floatingStyles = defineStyle({
    pos: "absolute",
    bg: "gray.900",
    px: "0.5",
    ml: "3",
    color: "#8f8f8f",
    top: "-0.6rem",
    insetStart: "2",
    fontWeight: "normal",
    fontSize: "xs",
    pointerEvents: "none",
    transition: "position",
    _peerPlaceholderShown: {
        color: "fg.muted",
        top: "1.4rem",
        insetStart: "3",
        fontSize: 'md'
    },
    _peerFocusVisible: {
        color: "fg",
        top: "-2.5",
        insetStart: "2",
        fontSize: "xs",
    },
})

const PrimaryButton = chakra(Button, {
    base: {
        w: "full",
        borderRadius: "xl",
        colorScheme: "whiteAlpha",
    }
})

const FuelIcon = createIcon({
    path: (
        <path
            d="M22.8744 0C10.2181 0 0 10.218 0 22.8744V344H284.626C294.246 344 303.497 340.179 310.308 333.368L333.368 310.308C340.179 303.497 344 294.246 344 284.626V0H22.8744ZM224.608 44.231L112.718 156.121C109.956 158.882 106.182 160.447 102.27 160.447C96.5631 160.447 91.3157 157.134 88.8763 151.978L45.5194 60.3402C41.9756 52.8383 47.4525 44.231 55.7374 44.231H224.608ZM44.231 299.769V190.916C44.231 185.117 48.9257 180.422 54.7249 180.422H163.577L44.231 299.769ZM172.598 160.447H136.559L244.998 52.0097C249.968 47.0382 256.734 44.231 263.776 44.231H299.814L191.377 152.668C186.407 157.64 179.64 160.447 172.598 160.447Z"
            fill="currentColor"></path>
    ),
    viewBox: "0 0 344 344"
})

const BakoIcon = createIcon({
    path: (
        <>
            <path d="M0.601562 301.809L349.398 475.379L175.035 201.194L0.601562 301.809Z" fillOpacity="0.5"
                  fill="currentColor"/>
            <path
                d="M304.147 248.109L174.965 173.575V0L0.601562 100.61V301.815L174.965 201.206V374.78L0.601562 475.39L174.965 576L349.329 475.39V326.322C349.329 294.054 332.101 264.243 304.147 248.109Z"
                fill="currentColor"/>
        </>
    ),
    viewBox: "0 0 350 576"
})

const PageWrapper = ({children}: { children: ReactNode }) => {
    return (
        <Flex
            align="center"
            justify="center"
            minH={`${window.innerHeight}px`}
            bg="black"
            w="100vw"
        >
            <Center
                bgImage="linear-gradient({colors.gray.900}, {colors.gray.950})"
                borderRadius={{
                    base: 'none',
                    sm: '3xl'
                }}
                borderWidth={2}
                borderBlockStyle="solid"
                borderColor="rgb(31 31 31 / 1)"
                maxW={{
                    base: '100%',
                    sm: 340
                }}
                w="full"
                p={4}
                px={5}
                height={{
                    base: `${window.innerHeight}px`,
                    sm: 600
                }}
                maxH={{
                    base: `${window.innerHeight}px`,
                    sm: 600
                }}
                textAlign="center"
                flexDirection="column"
            >
                {children}
            </Center>
        </Flex>
    )
}

enum AuthPageStep {
    Create = 'Create',
    Connect = 'Connect',
}

const AuthPage = () => {
    const [step, setStep] = useState<AuthPageStep>()

    const {passkey, onConnect, changePage} = usePasskey();

    const passkeys = useQuery({
        queryKey: ["passkeys"],
        queryFn: async () => passkey.myPasskeys(),
        initialData: [],
    });

    const createAccount = useMutation({
        mutationFn: async () => {
            const account = await passkey.createAccount(`Account ${passkeys.data.length + 1}`);
            changePage(Pages.Wallet);
            return account;
        },
        onSuccess: (data) => {
            onConnect(data.id);
        }
    });

    const connectAccount = useMutation({
        mutationFn: async (account: string) => {
            await passkey.connect(account);
            changePage(Pages.Wallet);
            return account;
        },
        onSuccess: (data) => {
            onConnect(data);
        }
    });

    const myPasskeys = useMemo(() => {
        return createListCollection({
            items: passkeys.data,
            itemToString: (item) => `${item.passkey.identifier} - ${formatAddress(item.passkey.predicateAddress)}`,
            itemToValue: (item) => item.id,
        });
    }, [passkeys.data]);

    const hasPasskeys = passkeys.data?.length > 0;

    const CreateAccount = (
        <VStack w="full" h="full" gap={5}>
            <Flex alignItems="center" flex={1}>
                <EmptyState
                    title="Passkey Account"
                    description="One tap to descentralize web."
                    p={0}
                />
            </Flex>
            <PrimaryButton
                size="xl"
                onClick={() => createAccount.mutate()}
                disabled={createAccount.isPending}
            >
                Continue
                <Text as="span" fontSize="lg">→</Text>
            </PrimaryButton>
        </VStack>
    );

    const ConnectAccount = (
        <>
            <EmptyState
                mt={4}
                title="Select an Account"
                description="One tap to descentralize web."
                p={0}
            />
            <VStack alignItems="start" w="full" maxH={424} overflowY="scroll" flex={1}>
                {myPasskeys.items.map((data) => (
                    <HStack
                        gap={5}
                        cursor="pointer"
                        onClick={() => connectAccount.mutate(data.id)}
                        px={4}
                        py={5}
                        borderColor="rgb(31 31 31 / 1)"
                        borderStyle="solid"
                        borderWidth={1}
                        borderRadius="xl"
                        w="full"
                        key={data.id}
                    >
                        <Avatar name={data.passkey.identifier}/>
                        <VStack gap={1} alignItems="start" flex={1} w="full">
                            <Heading size="sm">{data.passkey.identifier}</Heading>
                            <Text color="gray" textStyle="sm">{formatAddress(data.passkey.predicateAddress)}</Text>
                        </VStack>
                    </HStack>
                ))}
                {myPasskeys.items.length < 4 && (
                    <HStack
                        gap={5}
                        cursor="pointer"
                        onClick={() => createAccount.mutate()}
                        px={4}
                        py={5}
                        borderColor="rgb(31 31 31 / 1)"
                        borderStyle="solid"
                        borderWidth={1}
                        borderRadius="xl"
                        w="full"
                        key="add"
                    >
                        <Avatar fallback={<></>}>
                            <IoMdAdd/>
                        </Avatar>
                        <VStack gap={1} alignItems="start" flex={1} w="full">
                            <Heading size="sm">Create new account</Heading>
                        </VStack>
                    </HStack>
                )}
            </VStack>
        </>
    );

    return (
        <VStack justifyContent="center" h="full" w="full" gap="8">
            {!hasPasskeys && CreateAccount}
            {!step && hasPasskeys && (
                <>
                    <EmptyState
                        title="Passkey Account"
                        description="One tap to descentralize web."
                        p={0}
                    />
                    <VStack w="full" gap="5">
                        <PrimaryButton
                            size="xl"
                            onClick={() => setStep(AuthPageStep.Connect)}
                        >
                            Select an Account
                            <Text as="span" fontSize="lg">→</Text>
                        </PrimaryButton>
                        <HStack w="full">
                            <Separator flex="1"/>
                            <Text flexShrink="0">or</Text>
                            <Separator flex="1"/>
                        </HStack>
                        <PrimaryButton
                            size="xl"
                            onClick={() => createAccount.mutate()}
                        >
                            Create Account
                            <Text as="span" fontSize="lg">→</Text>
                        </PrimaryButton>
                    </VStack>
                </>
            )}
            {step === AuthPageStep.Create && CreateAccount}
            {step === AuthPageStep.Connect && ConnectAccount}
        </VStack>
    );
};

const FaucetPage = () => {
    const [isClicked, setIsClicked] = useState(false);
    const {passkey, changePage} = usePasskey();
    const {copy, copied} = useClipboard({
        value: passkey.vault?.address.toString() ?? "",
    });

    const hasBalance = useQuery({
        queryKey: ["has-balance", passkey.vault?.address],
        queryFn: async () => {
            const balance = await passkey.vault?.getBalance();
            return !!balance?.gt(bn(0));
        },
        refetchOnWindowFocus: true,
        refetchInterval: 1000,
        enabled: !!passkey.vault,
    });

    useEffect(() => {
        if (hasBalance.data) {
            changePage(Pages.Wallet);
        }
    }, [hasBalance.data]);

    return (
        <VStack justifyContent="center" w="full" h="full" gap="8">
            <EmptyState
                icon={<FuelIcon/>}
                title="Start adding tokens"
                description="Faucet your passkey account with some test tokens to get started."
            >
                <Tag onClick={copy} cursor="pointer" size="lg" py={1} px={3}
                     endElement={copied ? <BiCheck/> : <BiCopy/>} variant="subtle">
                    {formatAddress(passkey.vault?.address.toString() ?? "")}
                </Tag>
            </EmptyState>
            <Button loading={isClicked} loadingText="Funding..." onClick={() => {
                setIsClicked(true);
                passkey.getFaucet();
            }} size="xl" borderRadius="xl" w="full" colorScheme="whiteAlpha">
                Faucet
                <Text as="span" fontSize="lg">→</Text>
            </Button>
        </VStack>
    );
};

enum WalletPageStep {
    TxResult = "TxResult",
    TxForm = "TxForm",
    Home = "Home",
}

interface TransactionData {
    to: string;
    amount: string;
}

const TransactionForn = (props: {
    balance: BN,
    onCancel: () => void,
    onSend: (data: TransactionData) => void,
    isLoading: boolean
}) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [formValue, setFormValue] = useState({
        handleOrAddress: '',
        amount: ''
    });

    const [resolver, setResolver] = useState<string | null>(null);

    const fetchHandle = useCallback(debounce(async (value) => {
        const client = new BakoIDClient();
        const resolver = await client.resolver(value, 9889);
        setResolver(resolver);

        inputRef.current?.blur();
    }, 400), []);

    const onAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {value} = e.target;
        setFormValue({...formValue, handleOrAddress: value});

        const isHandle = !value.startsWith('0x');
        if (isHandle && isValidDomain(value)) {
            fetchHandle(value);
        }
    }

    const onAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {value} = e.target;
        setFormValue({...formValue, amount: value});
    }

    const clear = () => {
        setResolver(null);
        setFormValue({...formValue, handleOrAddress: ""});
    }

    const isValid = useMemo(() => {
        let amount: BN;
        try {
            if (!formValue.amount) return false;
            amount = bn.parseUnits(formValue.amount);
        } catch (_) {
            return false;
        }

        const hasBalance = props.balance.gt(0) && amount.gt(0) && amount.lte(props.balance);
        const address = resolver ?? formValue.handleOrAddress;
        return hasBalance && isB256(address);
    }, [formValue.amount, formValue.handleOrAddress, props.balance, resolver]);

    return (
        <>
            <Box as={Center} gap={6} flexDir="column" w="full" h="full">
                <Field.Root>
                    <Box pos="relative" w="full">
                        <Input
                            ref={inputRef}
                            autoComplete="off"
                            value={formValue.handleOrAddress}
                            onChange={onAddressInputChange}
                            bg="gray.900"
                            size="2xl"
                            borderRadius="xl"
                            className="peer"
                            placeholder=""
                        />
                        <HStack hidden={!resolver} justifyContent="space-between" textAlign="left" bg="gray.900"
                                left="1px" px="4"
                                w="calc(100% - 2px)" position="absolute" top="0.8rem" zIndex="2">
                            <Box>
                                <Text fontSize="sm" fontWeight="semibold">@{formValue.handleOrAddress}</Text>
                                <Text fontSize="xs">{formatAddress(resolver!)}</Text>
                            </Box>
                            <IoIosClose cursor="pointer" onClick={clear} size="24"/>
                        </HStack>
                        <Field.Label css={floatingStyles}>Handle or Address</Field.Label>
                    </Box>
                </Field.Root>
                <Field.Root>
                    <Box pos="relative" w="full">
                        <Input
                            autoComplete="off"
                            value={formValue.amount}
                            onChange={onAmountInputChange}
                            px={4}
                            bg="gray.900"
                            size="2xl"
                            borderRadius="xl"
                            className="peer"
                            placeholder=""
                            mb={2}
                        />
                        <Field.Label css={floatingStyles}>ETH Amount</Field.Label>
                        <Field.HelperText fontSize="sm">Balance: {props.balance.format()} ETH</Field.HelperText>
                    </Box>
                </Field.Root>
            </Box>
            <VStack w="full">
                <Button w="full"
                        loading={props.isLoading}
                        loadingText="Sending..."
                        disabled={!isValid}
                        onClick={() => props.onSend({
                            amount: formValue.amount,
                            to: resolver ?? formValue.handleOrAddress
                        })}
                        size="xl"
                        borderRadius="xl"
                        colorScheme="whiteAlpha"
                >
                    Send
                </Button>
                <Button w="full"
                        onClick={props.onCancel}
                        disabled={props.isLoading}
                        size="xl"
                        borderRadius="xl"
                        colorScheme="whiteAlpha"
                        variant="outline"
                >
                    Cancel
                </Button>
                {/*<Button loading={signMessage.isPending} loadingText="Signin..." onClick={() => signMessage.mutate()} size="xl" borderRadius="xl" colorScheme="">*/}
                {/*    Sign Message*/}
                {/*</Button>*/}
            </VStack>
        </>
    )
}

const WalletPage = () => {
    const {passkey, passkeyId, changePage} = usePasskey();
    const [step, setStep] = useState(WalletPageStep.Home)
    const {copy, copied} = useClipboard({
        value: passkey.vault?.address.toString() ?? "",
    });

    useEffect(() => {
        if (passkeyId) {
            passkey.connect(passkeyId!);
        }
    }, [passkeyId]);

    const balance = useQuery({
        queryKey: ['current-balance', passkey.vault?.address.toString()],
        queryFn: async () => {
            return passkey.vault!.getBalance();
        },
        enabled: !!passkey.vault,
        initialData: bn(0),
        refetchInterval: 1000,
    });

    const sendTransaction = useMutation({
        mutationFn: async (data: TransactionData) => {
            return passkey.sendTransaction({
                name: 'sendTransaction-by-passkey-dapp',
                assets: [
                    {
                        assetId: passkey.vault!.provider.getBaseAssetId(),
                        amount: data.amount,
                        to: data.to,
                    },
                ],
            });
        },
        onSuccess: () => {
            setStep(WalletPageStep.TxResult);
        },
        onError: (error) => {
            console.log(error)
        }
    });

    // const signMessage = useMutation({
    //     mutationFn: async () => {
    //         return passkey.signMessage('Hello World!');
    //     },
    //     onSuccess: (data) => {
    //         console.log(data);
    //     }
    // });

    const onViewInExplorer = () => {
        const explorer = 'https://app-testnet.fuel.network/';
        window.open(`${explorer}tx/${sendTransaction.data!.id}`);
    }

    const TxResult = (
        <>
            <EmptyState
                icon={<BiCheck color="green"/>}
                title="Transaction Success!"
                description="0.0001 ETH has been sent to 0x7175...d5a1"
                h="full"
                display="flex"
                alignItems="center"
            />
            <VStack w="full" gap={2}>
                <Button onClick={onViewInExplorer} size="xl" borderRadius="xl" w="full" colorScheme="whiteAlpha">
                    View in Explorer
                    <Text as="span" fontSize="lg">→</Text>
                </Button>
                <Button variant="outline" onClick={() => setStep(WalletPageStep.Home)} size="xl" borderRadius="xl"
                        w="full" colorScheme="gray">
                    Back to Home
                </Button>
            </VStack>
        </>
    )

    const Home = (
        <>
            <Box as={Center} flexDir="column" w="full" h="full">
                <Box mb={2}>
                    <StatRoot justifyContent="center" alignItems="center" size="lg">
                        <StatLabel>Balance</StatLabel>
                        <StatValueText>{balance.data?.format()} ETH</StatValueText>
                    </StatRoot>
                </Box>
                <Tag onClick={copy} cursor="pointer" size="lg" py={1} px={3}
                     endElement={copied ? <BiCheck/> : <BiCopy/>} variant="subtle">
                    {formatAddress(passkey.vault?.address.toString() ?? "")}
                </Tag>
            </Box>
            <Group w="full">
                <Button
                    w="full"
                    onClick={() => setStep(WalletPageStep.TxForm)}
                    size="xl"
                    borderRadius="xl" colorScheme="whiteAlpha"
                    disabled={balance.data?.lte(0)}
                >
                    Send
                    <Text as="span" fontSize="lg">→</Text>
                </Button>
                {/*<Button loading={signMessage.isPending} loadingText="Signin..." onClick={() => signMessage.mutate()} size="xl" borderRadius="xl" colorScheme="">*/}
                {/*    Sign Message*/}
                {/*</Button>*/}
            </Group>
        </>
    )

    return (
        <VStack as={Center} h="full" w="full" gap="8" position="relative">
            <IconButton onClick={() => {
                passkey.disconnect();
                changePage(Pages.Auth);
            }} variant="subtle" rounded="full" top={0} right={0} position="absolute"
                        aria-label="Logout Wallet">
                <CiLogout/>
            </IconButton>
            {step === WalletPageStep.Home && Home}
            {step === WalletPageStep.TxResult && TxResult}
            {step === WalletPageStep.TxForm &&
                <TransactionForn
                    onCancel={() => setStep(WalletPageStep.Home)}
                    onSend={(data) => sendTransaction.mutate(data)}
                    balance={balance.data}
                    isLoading={sendTransaction.isPending}
                />
            }
        </VStack>
    );
};

enum Pages {
    Auth,
    Faucet,
    Wallet,
}

function App() {
    const {page} = usePasskey();

    return (
        <PageWrapper>
            {page === Pages.Auth && <AuthPage/>}
            {page === Pages.Faucet && <FaucetPage/>}
            {page === Pages.Wallet && <WalletPage/>}
            {/* @ts-expect-error target not included in hstack */}
            <HStack as="a" target="blank" href="https://bako.global/" mt={4} gap={1}>
                <Text color="gray" fontSize="xs" as="span">
                    Powered by
                </Text>
                <BakoIcon size="sm" color="gray.600"/>
            </HStack>
        </PageWrapper>
    );
}

export default App
