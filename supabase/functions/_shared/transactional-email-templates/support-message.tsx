import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "GameNight Stats"

interface SupportMessageProps {
  name?: string
  email?: string
  message?: string
}

const SupportMessageEmail = ({ name, email, message }: SupportMessageProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Nuevo mensaje de soporte de {name || 'un usuario'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>📩 Nuevo mensaje de soporte</Heading>
        <Text style={label}>De:</Text>
        <Text style={value}>{name || 'Sin nombre'} ({email || 'Sin email'})</Text>
        <Hr style={hr} />
        <Text style={label}>Mensaje:</Text>
        <Text style={messageStyle}>{message || 'Sin contenido'}</Text>
        <Hr style={hr} />
        <Text style={footer}>Enviado desde {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SupportMessageEmail,
  subject: (data: Record<string, any>) => `[Soporte] Mensaje de ${data.name || 'usuario'}`,
  to: 's.vidal.picazo@gmail.com',
  displayName: 'Mensaje de soporte',
  previewData: { name: 'Juan', email: 'juan@example.com', message: '¡Hola! Tengo una duda sobre la app.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 20px' }
const label = { fontSize: '12px', color: '#999999', margin: '0 0 4px' }
const value = { fontSize: '14px', color: '#333333', margin: '0 0 16px' }
const hr = { borderColor: '#e5e5e5', margin: '16px 0' }
const messageStyle = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px', whiteSpace: 'pre-wrap' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
