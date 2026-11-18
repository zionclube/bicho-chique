export function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

export function isValidCpf(value: string) {
  const digits = onlyDigits(value)
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  const checkDigit = (length: number) => {
    let sum = 0
    for (let index = 0; index < length; index += 1) {
      sum += Number(digits[index]) * (length + 1 - index)
    }
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }

  return checkDigit(9) === Number(digits[9]) && checkDigit(10) === Number(digits[10])
}

export function maskCpf(digits: string) {
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9)}`
}

export function formatCpf(digits: string) {
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}
