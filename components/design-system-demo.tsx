"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

export function DesignSystemDemo() {
  return (
    <div className="min-h-screen bg-background p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-hoja-verde-700">
          🌿 Hoja Verde Design System
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Demostración del sistema de diseño implementado con la paleta oficial de colores
          y componentes mejorados.
        </p>
      </div>

      {/* Color Palette Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Paleta de Colores</CardTitle>
          <CardDescription>
            Colores oficiales de la marca Hoja Verde
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center space-y-2">
              <div className="w-full h-20 rounded-lg bg-hoja-verde-700 shadow-md"></div>
              <p className="text-sm font-medium">Primary Green</p>
              <code className="text-xs text-muted-foreground">#325444</code>
            </div>
            <div className="text-center space-y-2">
              <div className="w-full h-20 rounded-lg bg-brand-sage shadow-md"></div>
              <p className="text-sm font-medium">Secondary Sage</p>
              <code className="text-xs text-muted-foreground">#7B9A7D</code>
            </div>
            <div className="text-center space-y-2">
              <div className="w-full h-20 rounded-lg bg-brand-cream border shadow-md"></div>
              <p className="text-sm font-medium">Natural Cream</p>
              <code className="text-xs text-muted-foreground">#F5F3EF</code>
            </div>
            <div className="text-center space-y-2">
              <div className="w-full h-20 rounded-lg bg-brand-earth shadow-md"></div>
              <p className="text-sm font-medium">Earth Tone</p>
              <code className="text-xs text-muted-foreground">#C29D7F</code>
            </div>
            <div className="text-center space-y-2">
              <div className="w-full h-20 rounded-lg bg-brand-copper shadow-md"></div>
              <p className="text-sm font-medium">Accent Copper</p>
              <code className="text-xs text-muted-foreground">#8B5A3C</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buttons Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Componentes Button</CardTitle>
          <CardDescription>
            Diferentes variants y sizes disponibles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Button Variants */}
          <div className="space-y-3">
            <h4 className="text-lg font-medium">Variants</h4>
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="brand">Brand</Button>
              <Button variant="sage">Sage</Button>
              <Button variant="earth">Earth</Button>
            </div>
          </div>

          {/* Button Sizes */}
          <div className="space-y-3">
            <h4 className="text-lg font-medium">Sizes</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" variant="brand">Small</Button>
              <Button size="default" variant="brand">Default</Button>
              <Button size="lg" variant="brand">Large</Button>
              <Button size="xl" variant="brand">Extra Large</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Components Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Componentes de Formulario</CardTitle>
          <CardDescription>
            Inputs y elementos de formulario con el nuevo diseño
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" placeholder="correo@ejemplo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" placeholder="Nombre de la empresa" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Mensaje</Label>
            <textarea 
              id="message"
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-4 py-2 text-sm shadow-sm transition-all duration-200 placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:border-hoja-verde-500 hover:border-hoja-verde-300 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Escriba su mensaje aquí..."
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline">Cancelar</Button>
            <Button variant="brand">Enviar Mensaje</Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards Demo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-brand transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🌱 Cotizaciones
            </CardTitle>
            <CardDescription>
              Sistema de gestión de cotizaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Este mes:</span>
                <Badge variant="secondary">24 nuevas</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pendientes:</span>
                <span className="text-sm font-medium">8</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="sage" size="sm" className="w-full">
              Ver Cotizaciones
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-brand transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏢 Clientes
            </CardTitle>
            <CardDescription>
              Gestión de empresas y contactos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="text-sm font-medium">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Activos:</span>
                <Badge variant="default">142</Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="earth" size="sm" className="w-full">
              Ver Clientes
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-brand transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📦 Productos
            </CardTitle>
            <CardDescription>
              Catálogo y gestión de inventario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Categorías:</span>
                <span className="text-sm font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Productos:</span>
                <Badge variant="secondary">340</Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="brand" size="sm" className="w-full">
              Ver Productos
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Modal Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Modal/Dialog Mejorado</CardTitle>
          <CardDescription>
            Modal con nuevo overlay y animaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="brand">Abrir Modal Demo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modal del Design System</DialogTitle>
                <DialogDescription>
                  Este modal muestra las mejoras implementadas: overlay con blur,
                  animaciones suaves y botones con estilo de marca.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="demo-input">Campo de ejemplo</Label>
                  <Input id="demo-input" placeholder="Escribe algo aquí..." />
                </div>
                <p className="text-sm text-muted-foreground">
                  Nota las transiciones suaves, el overlay con tinte verde sutil,
                  y el botón de cerrar con hover effect.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancelar</Button>
                <Button variant="brand">Confirmar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center pt-8 border-t">
        <p className="text-sm text-muted-foreground">
          Design System implementado - Hoja Verde v1.0
        </p>
      </div>
    </div>
  )
}