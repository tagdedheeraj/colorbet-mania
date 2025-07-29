
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, RefreshCw, Users } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  role: string;
  created_at: string;
}

interface UserManagementProps {
  users: User[];
  onUpdateBalance: (userId: string, newBalance: number) => void;
  loading?: boolean;
  onRefresh?: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ 
  users, 
  onUpdateBalance, 
  loading = false, 
  onRefresh 
}) => {
  const [editBalance, setEditBalance] = useState<{userId: string, balance: string} | null>(null);

  const handleUpdateBalance = () => {
    if (!editBalance) return;

    const newBalance = parseFloat(editBalance.balance);
    if (isNaN(newBalance)) {
      return;
    }

    onUpdateBalance(editBalance.userId, newBalance);
    setEditBalance(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts and balances ({users.length} users)
              </CardDescription>
            </div>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Users
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found</p>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="mt-2"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>₹{user.balance}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                          {user.role || 'user'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditBalance({userId: user.id, balance: user.balance.toString()})}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Balance
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Balance Modal */}
      {editBalance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit User Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="balance">New Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  value={editBalance.balance}
                  onChange={(e) => setEditBalance({...editBalance, balance: e.target.value})}
                  placeholder="Enter new balance"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateBalance} className="flex-1">
                  Update Balance
                </Button>
                <Button variant="outline" onClick={() => setEditBalance(null)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default UserManagement;
