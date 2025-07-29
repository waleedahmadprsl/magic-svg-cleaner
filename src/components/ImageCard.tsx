import React from 'react';
import { ProcessedImage } from '../types/image';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageCardProps {
  image: ProcessedImage;
}

export const ImageCard: React.FC<ImageCardProps> = ({ image }) => {
  const getStatusIcon = () => {
    switch (image.status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (image.status) {
      case 'pending':
        return 'bg-muted text-muted-foreground';
      case 'processing':
        return 'bg-processing text-processing-foreground';
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handlePreview = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Original Image Preview */}
          <div className="relative aspect-square rounded-md overflow-hidden bg-muted">
            <img
              src={image.originalUrl}
              alt={image.originalFile.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* File Info */}
          <div>
            <p className="text-sm font-medium truncate" title={image.originalFile.name}>
              {image.originalFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(image.originalFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor()}>
              {getStatusIcon()}
              <span className="ml-1 capitalize">{image.status}</span>
            </Badge>
          </div>

          {/* Progress Bar */}
          {image.status === 'processing' && (
            <div className="space-y-1">
              <Progress value={image.progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {image.progress}%
              </p>
            </div>
          )}

          {/* Error Message */}
          {image.status === 'error' && image.error && (
            <div className="p-2 bg-destructive/10 rounded-md">
              <p className="text-xs text-destructive">{image.error}</p>
            </div>
          )}

          {/* Preview Buttons */}
          {image.status === 'completed' && (
            <div className="flex space-x-2">
              {image.cleanedImageUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(image.cleanedImageUrl!)}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Clean
                </Button>
              )}
              {image.svgUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(image.svgUrl!)}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  SVG
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};