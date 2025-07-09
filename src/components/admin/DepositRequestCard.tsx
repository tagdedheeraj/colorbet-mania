
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Clock, User, CreditCard, Calendar, FileText } from 'lucide-react';
import { DepositRequest } from '@/services/depositRequestService';

interface DepositRequestCardProps {
  request: DepositRequest;
  onApprove: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string, notes: string) => Promise<void>;
  loading?: boolean;
}

const DepositRequestCard: React.FC<DepositRequestCardProps> = ({
  request,
  onApprove,
  onReject,
  loading = false
}) => {
  const [showActions, setShowActions] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleAction = async () => {
    if (!action) return;
    
    setProcessing(true);
    try {
      if (action === 'approve') {
        await onApprove(request.id, notes);
      } else {
        await onReject(request.id, notes || 'Rejected by admin');
      }
      setShowActions(false);
      setAction(null);
      setNotes('');
    } catch (error) {
      console.error('Error processing request:', error);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            ₹{request.amount.toLocaleString('en-IN')}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusIcon(request.status)}
            <Badge variant={getStatusColor(request.status) as any}>
              {request.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* User Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{request.users?.username}</p>
              <p className="text-sm text-muted-foreground">{request.users?.email}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="font-medium">₹{request.users?.balance?.toLocaleString('en-IN') || '0'}</p>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Payment Method</p>
            <p className="font-medium capitalize">{request.payment_method.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Transaction ID</p>
            <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
              {request.transaction_id}
            </p>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="text-sm">{formatDate(request.created_at)}</p>
            </div>
          </div>
          {request.processed_at && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Processed</p>
                <p className="text-sm">{formatDate(request.processed_at)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Admin Notes */}
        {request.admin_notes && (
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Admin Notes</p>
              <p className="text-sm bg-muted p-2 rounded">{request.admin_notes}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {request.status === 'pending' && !showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => {
                setAction('approve');
                setShowActions(true);
              }}
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setAction('reject');
                setShowActions(true);
              }}
              disabled={loading}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}

        {/* Action Form */}
        {showActions && action && (
          <div className="border-t pt-4 space-y-3">
            <div>
              <Label htmlFor="notes">
                {action === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  action === 'approve' 
                    ? 'Add any notes about this approval...' 
                    : 'Please provide a reason for rejection...'
                }
                className="mt-1"
                required={action === 'reject'}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAction}
                disabled={processing || (action === 'reject' && !notes.trim())}
                variant={action === 'approve' ? 'default' : 'destructive'}
              >
                {processing ? 'Processing...' : `${action === 'approve' ? 'Approve' : 'Reject'} Request`}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowActions(false);
                  setAction(null);
                  setNotes('');
                }}
                disabled={processing}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DepositRequestCard;
