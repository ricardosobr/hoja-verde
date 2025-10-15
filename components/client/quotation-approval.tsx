'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, XCircle, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ClientQuotation } from '@/lib/client-quotations'
import { getStatusLabel } from '@/lib/client-quotations'

interface QuotationApprovalProps {
  quotation: ClientQuotation
  onStatusUpdate: (status: 'in_review' | 'approved' | 'rejected') => Promise<void>
  isUpdating: boolean
}

export function QuotationApproval({ quotation, onStatusUpdate, isUpdating }: QuotationApprovalProps) {
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleStartReview = async () => {
    await onStatusUpdate('in_review')
    setShowReviewDialog(false)
  }

  const handleApprove = async () => {
    await onStatusUpdate('approved')
    setShowApprovalDialog(false)
  }

  const handleReject = async () => {
    // In a full implementation, we might store the rejection reason
    await onStatusUpdate('rejected')
    setShowRejectionDialog(false)
    setRejectionReason('')
  }

  const currentStatus = quotation.quotation_status

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Estado Actual</h4>
        <Badge className="text-sm px-3 py-1">
          {getStatusLabel(currentStatus)}
        </Badge>
      </div>

      {/* Actions based on current status */}
      {currentStatus === 'generated' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 text-center">
            Esta cotización está lista para tu revisión. ¿Deseas comenzar a revisarla?
          </p>
          
          <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
            <DialogTrigger asChild>
              <Button className="w-full" disabled={isUpdating}>
                <Eye className="h-4 w-4 mr-2" />
                Comenzar Revisión
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Comenzar Revisión</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro que deseas comenzar la revisión de esta cotización? 
                  Una vez iniciada, podrás aprobarla o rechazarla.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleStartReview} disabled={isUpdating}>
                  {isUpdating ? 'Procesando...' : 'Iniciar Revisión'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {currentStatus === 'in_review' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 text-center">
            Esta cotización está en revisión. Puedes aprobarla o rechazarla.
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Approve Dialog */}
            <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700" disabled={isUpdating}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprobar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Aprobar Cotización
                  </DialogTitle>
                  <DialogDescription>
                    ¿Estás seguro que deseas aprobar esta cotización? Esta acción convertirá 
                    automáticamente la cotización en una orden de trabajo.
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-green-800">
                        Al aprobar esta cotización:
                      </h4>
                      <ul className="text-sm text-green-700 mt-1 space-y-1">
                        <li>• Se creará automáticamente una orden de trabajo</li>
                        <li>• El equipo será notificado para comenzar la producción</li>
                        <li>• No podrás modificar los términos después</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700" 
                    onClick={handleApprove} 
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Procesando...' : 'Confirmar Aprobación'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" disabled={isUpdating}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center text-red-600">
                    <XCircle className="h-5 w-5 mr-2" />
                    Rechazar Cotización
                  </DialogTitle>
                  <DialogDescription>
                    ¿Estás seguro que deseas rechazar esta cotización? Esta acción no se puede deshacer.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rejection-reason">
                      Motivo del rechazo (opcional)
                    </Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="Describe brevemente por qué rechazas esta cotización..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Esta información ayudará al equipo a mejorar futuras cotizaciones.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setShowRejectionDialog(false)
                    setRejectionReason('')
                  }}>
                    Cancelar
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleReject} 
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Procesando...' : 'Confirmar Rechazo'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {(currentStatus === 'approved' || currentStatus === 'rejected' || currentStatus === 'converted') && (
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            {currentStatus === 'approved' && <CheckCircle className="h-6 w-6 text-green-600" />}
            {currentStatus === 'rejected' && <XCircle className="h-6 w-6 text-red-600" />}
            {currentStatus === 'converted' && <CheckCircle className="h-6 w-6 text-purple-600" />}
          </div>
          <p className="text-sm text-gray-600">
            {currentStatus === 'approved' && 'Esta cotización ha sido aprobada y está siendo procesada.'}
            {currentStatus === 'rejected' && 'Esta cotización ha sido rechazada.'}
            {currentStatus === 'converted' && 'Esta cotización ha sido convertida en una orden de trabajo.'}
          </p>
        </div>
      )}
    </div>
  )
}