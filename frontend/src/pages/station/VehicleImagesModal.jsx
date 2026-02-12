import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Upload, Trash2, Check, Loader2, Eye, Download } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

export default function VehicleImagesModal({ isOpen, onClose, vehicle, userStation }) {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (isOpen && vehicle) {
      fetchUserProfile();
      fetchVehicleImages();
    }
  }, [isOpen, vehicle]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/auth/profile');
      if (response.data.success) {
        setUserProfile(response.data.data.user);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchVehicleImages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/vehicles/${vehicle._id}/images`);
      
      if (response.data.success) {
        setImages(response.data.data.images || []);
      } else {
        toast.error('Failed to load images');
        setImages([]);
      }
    } catch (error) {
      console.error('Error fetching vehicle images:', error);
      toast.error('Failed to load vehicle images');
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

const checkStationPermission = () => {
  // EXACTLY what your backend does
  if (userProfile?.role === 'station_admin') {
    // Get vehicle.stationID.toString() - EXACT match to backend
    const vehicleStationId = vehicle.stationID?.toString();
    
    // Get user.stationID?.toString() - EXACT match to backend
    const userStationId = userProfile?.stationID?.toString();
    
    // EXACT same comparison as your backend
    if (vehicleStationId?.toString() !== userStationId?.toString()) {
      return false; // 403 - Access denied
    }
    return true; // Permission granted
  }
  
  // Super admin check
  if (userProfile?.role === 'super_admin') {
    return true;
  }
  
  return false;
};

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    // Check permission before uploading
    if (!checkStationPermission()) {
      toast.error('You can only upload images to vehicles from your own station');
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      setUploading(true);
      const response = await api.post(
        `/api/vehicles/${vehicle._id}/upload-images`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        toast.success(`${files.length} image(s) uploaded successfully`);
        fetchVehicleImages();
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      
      // Handle specific error messages
      if (error.response?.status === 403) {
        toast.error('You can only upload images to vehicles from your own station');
      } else {
        toast.error(error.response?.data?.message || 'Failed to upload images');
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSetPrimary = async (imageUrl) => {
    // Check permission before setting primary
    if (!checkStationPermission()) {
      toast.error('You can only modify images for vehicles from your own station');
      return;
    }

    try {
      await api.post(`/api/vehicles/${vehicle._id}/set-primary-image`, {
        imageUrl
      });
      toast.success('Primary image set successfully');
      fetchVehicleImages();
    } catch (error) {
      console.error('Error setting primary image:', error);
      
      if (error.response?.status === 403) {
        toast.error('You can only modify images for vehicles from your own station');
      } else {
        toast.error(error.response?.data?.message || 'Failed to set primary image');
      }
    }
  };

  const handleDeleteImage = async (imageUrl) => {
    // Check permission before deleting
    if (!checkStationPermission()) {
      toast.error('You can only delete images from vehicles in your own station');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      await api.delete(`/api/vehicles/${vehicle._id}/images/${encodeURIComponent(imageUrl)}`);
      toast.success('Image deleted successfully');
      fetchVehicleImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      
      if (error.response?.status === 403) {
        toast.error('You can only delete images from vehicles in your own station');
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete image');
      }
    }
  };

  const handleDownloadImage = (imageUrl, fileName) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName || `vehicle-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreviewImage = (image) => {
    setSelectedImage(image);
    setPreviewImage(image.url);
  };

  if (!isOpen || !vehicle) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b rounded-t-lg">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Vehicle Images: {vehicle.plateNumber}
                </h2>
                <p className="text-sm text-gray-600">
                  {vehicle.make} {vehicle.model} • {vehicle.carType}
                </p>
                {!checkStationPermission() && userProfile?.role === 'station_admin' && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ You don't have permission to modify images for this vehicle
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Upload Section - Only show if user has permission */}
        {checkStationPermission() && (
          <div className="border-b p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Upload vehicle images (JPEG, PNG, GIF up to 10MB)
                </p>
                <p className="text-xs text-gray-500">
                  First uploaded image will be set as primary by default
                </p>
              </div>
              <div>
                <label className="btn-primary flex items-center gap-2 cursor-pointer">
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Images
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Images Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No images uploaded</h3>
              <p className="text-gray-600">
                {checkStationPermission() 
                  ? 'Upload images to display them here'
                  : 'This vehicle has no images'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div 
                  key={image.url || index}
                  className="relative group border rounded-lg overflow-hidden bg-gray-100 hover:shadow-lg transition-shadow"
                >
                  {/* Image */}
                  <div 
                    className="aspect-square cursor-pointer"
                    onClick={() => handlePreviewImage(image)}
                  >
                    <img
                      src={image.url}
                      alt={`Vehicle ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300x300?text=Image+Error';
                      }}
                    />
                  </div>

                  {/* Image Info Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200">
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                      <div className="text-xs truncate">
                        {image.fileName || `Image ${index + 1}`}
                      </div>
                      <div className="text-xs opacity-75">
                        {image.fileType?.split('/')[1]?.toUpperCase() || 'Unknown'} • 
                        {image.fileSize ? ` ${(image.fileSize / 1024 / 1024).toFixed(2)}MB` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Primary Badge */}
                  {image.isPrimary && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Primary
                    </div>
                  )}

                  {/* Action Buttons - Only show delete/set-primary if user has permission */}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewImage(image);
                      }}
                      className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadImage(image.url, image.fileName);
                      }}
                      className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {checkStationPermission() && !image.isPrimary && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPrimary(image.url);
                        }}
                        className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm"
                        title="Set as primary"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {checkStationPermission() && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(image.url);
                        }}
                        className="p-1.5 bg-red-500 text-white hover:bg-red-600 rounded-full shadow-sm"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {images.length} image{images.length !== 1 ? 's' : ''} • 
              {images.filter(img => img.isPrimary).length === 0 && ' No primary image set'}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <button
              onClick={() => {
                setSelectedImage(null);
                setPreviewImage(null);
              }}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="bg-white rounded-lg overflow-hidden">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-auto max-h-[70vh] object-contain"
              />
              
              <div className="p-4 bg-white border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Image Details</h3>
                    <p className="text-sm text-gray-600">
                      {selectedImage.fileName || 'No filename'} • 
                      {selectedImage.fileSize && ` ${(selectedImage.fileSize / 1024 / 1024).toFixed(2)}MB`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadImage(selectedImage.url, selectedImage.fileName)}
                      className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Download
                    </button>
                    {checkStationPermission() && !selectedImage.isPrimary && (
                      <button
                        onClick={() => {
                          handleSetPrimary(selectedImage.url);
                          setSelectedImage(null);
                        }}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Set as Primary
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}