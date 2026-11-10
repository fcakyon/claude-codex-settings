import google from "./logos/google.svg"
import github from "./logos/github.svg"
import apple from "./logos/apple.svg"
import huggingface from "./logos/huggingface.svg"

export const providerLogos: Record<string, string> = {
  google,
  github,
  apple,
  huggingface,
}

export function ProviderLogo({ provider }: { provider: string }) {
  return <img className={`app-provider-logo${provider === "github" || provider === "apple" ? " app-provider-logo--mono" : ""}`} src={providerLogos[provider]} alt="" aria-hidden="true" width={24} height={24} />
}

