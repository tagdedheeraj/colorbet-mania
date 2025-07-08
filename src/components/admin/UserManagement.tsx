
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminService } from '@/services/adminService';
import { toast } from 'sonner';

interface UserManagementProps {
  users: any[];
  onDataReload: () => Promise<void>;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onDataReload }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newBalance, setNewBalance] = useState('');

  const handleUpdateBalance = async () => {
    if (!selectedUserId || !newBalance) {
      toast.error('Please select a user and enter a balance');
      return;
    }

    try {
      const balance = parseFloat(newBalance);
      if (isNaN(balance) || balance < 0) {
        toast.error('Please enter a valid balance amount');
        return;
      }

      const result = await AdminService.updateUserBalance(selectedUserId, balance);
      
      if (result.success) {
        toast.success('Balance updated successfully');
        setSelectedUserId('');
        setNewBalance('');
        await onDataReload();
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error('Failed to update balance');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage user accounts and balances ({users.length} users total)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 border rounded-lg bg-muted/10">
          <h3 className="text-lg font-semibold mb-4">Update User Balance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="user-select">Select User</Label>
              <select
                id="user-select"
                className="w-full p-2 border rounded"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">Select a user...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email}) - ₹{user.balance}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="new-balance">New Balance</Label>
              <Input
                id="new-balance"
                type="number"
                min="0"
                step="0.01"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="Enter new balance"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleUpdateBalance}>Update Balance</Button>
            </div>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users.map(user => (
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
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
