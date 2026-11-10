import assert from 'node:assert/strict'
import { test } from 'node:test'
import { build } from 'esbuild'

const compiled = await build({
  entryPoints: [new URL('../skills/app-auth/assets/pocketbase.ts', import.meta.url).pathname],
  bundle: true, write: false, format: 'esm', platform: 'node',
})
const { pocketBaseAuthMethods } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'))

test('PocketBase discovery exposes enabled methods without copying OAuth secrets into UI configuration', () => {
  const methods = {
    password: { enabled: true, identityFields: ['email'] },
    oauth2: { enabled: true, providers: [
      { name: 'google', displayName: 'Google', state: 'transient-state', codeVerifier: 'transient-verifier', authURL: 'https://provider.example/authorize' },
      { name: 'oidc2', displayName: 'Organization account', state: 'other-state', codeVerifier: 'other-verifier' },
    ] },
  }
  const endpoint = provider => '/auth/' + provider + '/login'
  assert.deepEqual(pocketBaseAuthMethods(methods, endpoint), {
    emailPassword: true,
    providers: [
      { id: 'google', label: 'Google', endpoint: '/auth/google/login' },
      { id: 'oidc2', label: 'Organization account', endpoint: '/auth/oidc2/login' },
    ],
  })
  assert.deepEqual(pocketBaseAuthMethods({ ...methods, password: { enabled: true, identityFields: ['username'] }, oauth2: { ...methods.oauth2, enabled: false } }, endpoint), { emailPassword: false, providers: [] })
  assert.equal(pocketBaseAuthMethods({ ...methods, password: { enabled: false, identityFields: ['email'] } }, endpoint).emailPassword, false)
})
