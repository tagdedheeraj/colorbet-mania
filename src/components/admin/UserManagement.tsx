
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
      const { error } = await AdminService.updateUserBalance(selectedUserId, balance);
      
      if (error) {
        toast.error('Failed to update balance');
        return;
      }

      await AdminService.logAdminAction(
        'update_balance',
        'user',
        selectedUserId,
        { old_balance: users.find(u => u.id === selectedUserId)?.balance, new_balance: balance }
      );

      toast.success('Balance updated successfully');
      setSelectedUserId('');
      setNewBalance('');
      await onDataReload();
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error('Failed to update balance');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage user accounts and balances</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 border rounded-lg">
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
                    {user.username} ({user.email}) - {user.balance} coins
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="new-balance">New Balance</Label>
              <Input
                id="new-balance"
                type="number"
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

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Username</th>
                <th className="border border-gray-300 p-2 text-left">Email</th>
                <th className="border border-gray-300 p-2 text-left">Balance</th>
                <th className="border border-gray-300 p-2 text-left">Role</th>
                <th className="border border-gray-300 p-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td className="border border-gray-300 p-2">{user.username}</td>
                  <td className="border border-gray-300 p-2">{user.email}</td>
                  <td className="border border-gray-300 p-2">{user.balance} coins</td>
                  <td className="border border-gray-300 p-2">
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="border border-gray-300 p-2">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
