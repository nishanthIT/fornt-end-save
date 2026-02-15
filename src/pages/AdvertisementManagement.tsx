import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Upload, Image, Plus, Trash2, Edit, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/api";

interface Advertisement {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const AdvertisementManagement: React.FC = () => {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    linkUrl: '',
    sortOrder: 0,
    imageFile: null as File | null,
    imagePreview: ''
  });

  const API_BASE = API_CONFIG.BASE_URL;
  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    loadAdvertisements();
  }, []);

  const loadAdvertisements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/advertisements?all=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdvertisements(data.advertisements || []);
      } else {
        toast.error('Failed to load advertisements');
      }
    } catch (error) {
      console.error('Error loading advertisements:', error);
      toast.error('Error loading advertisements');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      linkUrl: '',
      sortOrder: advertisements.length,
      imageFile: null,
      imagePreview: ''
    });
    setEditingAd(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleCreate = async () => {
    if (!formData.title) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.imageFile && !editingAd) {
      toast.error('Please select an image');
      return;
    }

    setCreating(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('linkUrl', formData.linkUrl);
      formDataToSend.append('sortOrder', String(formData.sortOrder));
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }

      const url = editingAd 
        ? `${API_BASE}/advertisements/${editingAd.id}`
        : `${API_BASE}/advertisements`;
      
      const method = editingAd ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        toast.success(editingAd ? 'Advertisement updated!' : 'Advertisement created!');
        setIsCreateDialogOpen(false);
        resetForm();
        loadAdvertisements();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save advertisement');
      }
    } catch (error) {
      console.error('Error saving advertisement:', error);
      toast.error('Error saving advertisement');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      linkUrl: ad.linkUrl || '',
      sortOrder: ad.sortOrder,
      imageFile: null,
      imagePreview: ad.imageUrl
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this advertisement?')) return;

    try {
      const response = await fetch(`${API_BASE}/advertisements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Advertisement deleted');
        loadAdvertisements();
      } else {
        toast.error('Failed to delete advertisement');
      }
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      toast.error('Error deleting advertisement');
    }
  };

  const handleToggleActive = async (ad: Advertisement) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('isActive', String(!ad.isActive));

      const response = await fetch(`${API_BASE}/advertisements/${ad.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        toast.success(`Advertisement ${!ad.isActive ? 'activated' : 'deactivated'}`);
        loadAdvertisements();
      } else {
        toast.error('Failed to update advertisement');
      }
    } catch (error) {
      console.error('Error updating advertisement:', error);
      toast.error('Error updating advertisement');
    }
  };

  const handleReorder = async (ad: Advertisement, direction: 'up' | 'down') => {
    const currentIndex = advertisements.findIndex(a => a.id === ad.id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= advertisements.length) return;

    const otherAd = advertisements[newIndex];
    
    try {
      // Update both advertisements' sort orders
      await Promise.all([
        fetch(`${API_BASE}/advertisements/${ad.id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: (() => { const fd = new FormData(); fd.append('sortOrder', String(otherAd.sortOrder)); return fd; })()
        }),
        fetch(`${API_BASE}/advertisements/${otherAd.id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: (() => { const fd = new FormData(); fd.append('sortOrder', String(ad.sortOrder)); return fd; })()
        })
      ]);
      
      loadAdvertisements();
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Error reordering advertisements');
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Advertisement Management</h1>
          <p className="text-muted-foreground">Manage home screen carousel advertisements</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Advertisement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingAd ? 'Edit Advertisement' : 'Create Advertisement'}</DialogTitle>
              <DialogDescription>
                {editingAd ? 'Update advertisement details' : 'Create a new carousel advertisement'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Advertisement title"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Link URL (optional)</label>
                <Input
                  value={formData.linkUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Sort Order</label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Image {!editingAd && '*'}</label>
                <div className="mt-2">
                  {formData.imagePreview ? (
                    <div className="relative">
                      <img
                        src={formData.imagePreview}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData(prev => ({ ...prev, imageFile: null, imagePreview: editingAd?.imageUrl || '' }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                    </label>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleCreate} 
                disabled={creating}
                className="w-full"
              >
                {creating ? 'Saving...' : (editingAd ? 'Update Advertisement' : 'Create Advertisement')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : advertisements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Image className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No advertisements yet</p>
            <p className="text-sm text-muted-foreground">Create your first advertisement to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {advertisements.map((ad, index) => (
            <Card key={ad.id} className={!ad.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="w-48 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{ad.title}</h3>
                        {ad.linkUrl && (
                          <a 
                            href={ad.linkUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {ad.linkUrl}
                          </a>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          Sort Order: {ad.sortOrder}
                        </p>
                      </div>
                      <Badge variant={ad.isActive ? "default" : "secondary"}>
                        {ad.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleReorder(ad, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleReorder(ad, 'down')}
                        disabled={index === advertisements.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(ad)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(ad.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-auto">
                      <Switch
                        checked={ad.isActive}
                        onCheckedChange={() => handleToggleActive(ad)}
                      />
                      <span className="text-xs">{ad.isActive ? 'On' : 'Off'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvertisementManagement;
