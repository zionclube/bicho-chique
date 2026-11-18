import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isValidCpf, maskCpf, onlyDigits } from './cpf.ts'

test('aceita CPF com dígitos verificadores corretos', () => {
  assert.equal(isValidCpf('529.982.247-25'), true)
  assert.equal(onlyDigits('529.982.247-25'), '52998224725')
})

test('recusa CPF incompleto, repetido ou com dígito errado', () => {
  assert.equal(isValidCpf('529.982.247-26'), false)
  assert.equal(isValidCpf('111.111.111-11'), false)
  assert.equal(isValidCpf('123'), false)
})

test('mascara o CPF deixando só o começo e o fim', () => {
  assert.equal(maskCpf('52998224725'), '529.***.***-25')
})
