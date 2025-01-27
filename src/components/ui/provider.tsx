"use client"

import { ChakraProvider, defaultConfig, createSystem } from "@chakra-ui/react"
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"

const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        heading: { value: "Arimo" },
        body: { value: "Arimo" },
      },
    },
  },
})

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider forcedTheme="dark" {...props} />
    </ChakraProvider>
  )
}
