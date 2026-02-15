import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Upload, Newspaper, Plus, Trash2, Edit, ExternalLink, Calendar } from "lucide-react";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/api";

interface News {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  sourceUrl?: string;
  isActive: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

const NewsManagement: React.FC = () => {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sourceUrl: '',
    publishedAt: new Date().toISOString().split('T')[0],
    imageFile: null as File | null,
    imagePreview: ''
  });

  const API_BASE = API_CONFIG.BASE_URL;
  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/news?all=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNewsList(data.news || []);
      } else {
        toast.error('Failed to load news');
      }
    } catch (error) {
      console.error('Error loading news:', error);
      toast.error('Error loading news');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      sourceUrl: '',
      publishedAt: new Date().toISOString().split('T')[0],
      imageFile: null,
      imagePreview: ''
    });
    setEditingNews(null);
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
    if (!formData.title || !formData.description) {
      toast.error('Please enter title and description');
      return;
    }

    setCreating(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('sourceUrl', formData.sourceUrl);
      formDataToSend.append('publishedAt', formData.publishedAt);
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }

      const url = editingNews 
        ? `${API_BASE}/news/${editingNews.id}`
        : `${API_BASE}/news`;
      
      const method = editingNews ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        toast.success(editingNews ? 'News updated!' : 'News created!');
        setIsCreateDialogOpen(false);
        resetForm();
        loadNews();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save news');
      }
    } catch (error) {
      console.error('Error saving news:', error);
      toast.error('Error saving news');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (news: News) => {
    setEditingNews(news);
    setFormData({
      title: news.title,
      description: news.description,
      sourceUrl: news.sourceUrl || '',
      publishedAt: new Date(news.publishedAt).toISOString().split('T')[0],
      imageFile: null,
      imagePreview: news.imageUrl || ''
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this news item?')) return;

    try {
      const response = await fetch(`${API_BASE}/news/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('News deleted');
        loadNews();
      } else {
        toast.error('Failed to delete news');
      }
    } catch (error) {
      console.error('Error deleting news:', error);
      toast.error('Error deleting news');
    }
  };

  const handleToggleActive = async (news: News) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('isActive', String(!news.isActive));

      const response = await fetch(`${API_BASE}/news/${news.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        toast.success(`News ${!news.isActive ? 'activated' : 'deactivated'}`);
        loadNews();
      } else {
        toast.error('Failed to update news');
      }
    } catch (error) {
      console.error('Error updating news:', error);
      toast.error('Error updating news');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">News Management</h1>
          <p className="text-muted-foreground">Manage news feed items for the home screen</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add News
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingNews ? 'Edit News' : 'Create News'}</DialogTitle>
              <DialogDescription>
                {editingNews ? 'Update news details' : 'Create a new news item'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="News title"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the news..."
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Source URL (optional)</label>
                <Input
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, sourceUrl: e.target.value }))}
                  placeholder="https://example.com/full-article"
                />
                <p className="text-xs text-muted-foreground mt-1">Link to full article when user taps the news</p>
              </div>

              <div>
                <label className="text-sm font-medium">Published Date</label>
                <Input
                  type="date"
                  value={formData.publishedAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, publishedAt: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Image (optional)</label>
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
                        onClick={() => setFormData(prev => ({ ...prev, imageFile: null, imagePreview: editingNews?.imageUrl || '' }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
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
                {creating ? 'Saving...' : (editingNews ? 'Update News' : 'Create News')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : newsList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Newspaper className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No news items yet</p>
            <p className="text-sm text-muted-foreground">Create your first news item to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {newsList.map((news) => (
            <Card key={news.id} className={!news.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {news.imageUrl ? (
                    <img
                      src={news.imageUrl}
                      alt={news.title}
                      className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-32 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Newspaper className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-lg truncate">{news.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {news.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(news.publishedAt)}
                          </span>
                          {news.sourceUrl && (
                            <a 
                              href={news.sourceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Source
                            </a>
                          )}
                        </div>
                      </div>
                      <Badge variant={news.isActive ? "default" : "secondary"} className="flex-shrink-0">
                        {news.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(news)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(news.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-auto">
                      <Switch
                        checked={news.isActive}
                        onCheckedChange={() => handleToggleActive(news)}
                      />
                      <span className="text-xs">{news.isActive ? 'On' : 'Off'}</span>
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

export default NewsManagement;
