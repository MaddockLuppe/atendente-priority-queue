import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImageSelect?: (file: File) => void;
  maxWidth?: number;
  maxHeight?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImageSelect, 
  maxWidth = 315, 
  maxHeight = 200 
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      // Verificar tipo de arquivo
      if (!file.type.includes('image/png') && !file.type.includes('image/jpeg') && !file.type.includes('image/jpg')) {
        toast({
          title: "Formato inválido",
          description: "Apenas arquivos PNG e JPG são permitidos",
          variant: "destructive"
        });
        resolve(false);
        return;
      }

      // Verificar dimensões
      const img = new Image();
      img.onload = () => {
        if (img.width === maxWidth && img.height === maxHeight) {
          resolve(true);
        } else {
          toast({
            title: "Dimensões incorretas",
            description: `A imagem deve ter exatamente ${maxWidth}x${maxHeight} pixels. Sua imagem: ${img.width}x${img.height}`,
            variant: "destructive"
          });
          resolve(false);
        }
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const isValid = await validateImage(file);

    if (isValid) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      onImageSelect?.(file);
      toast({
        title: "Imagem carregada",
        description: "Imagem carregada com sucesso!",
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        Logo/Imagem ({maxWidth}x{maxHeight}px)
      </Label>
      
      <Card className={`border-2 border-dashed transition-colors ${
        dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      }`}>
        <CardContent className="p-4">
          {selectedImage ? (
            <div className="relative">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full h-auto rounded-md"
                style={{ maxWidth: `${maxWidth}px`, maxHeight: `${maxHeight}px` }}
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 h-6 w-6 p-0"
                onClick={removeImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-8 cursor-pointer"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  Clique ou arraste uma imagem
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG ou JPG • {maxWidth}x{maxHeight}px
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </Button>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleInputChange}
            className="hidden"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageUpload;