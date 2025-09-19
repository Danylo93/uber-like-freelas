import { useState } from 'react';
import { apiService } from '../api/apiService';

export interface Review {
  id: string;
  service_request_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface CreateReviewData {
  service_request_id: string;
  rating: number;
  comment?: string;
}

export const useRating = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReview = async (reviewData: CreateReviewData): Promise<Review> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.post('/services/reviews', reviewData);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erro ao enviar avaliação';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceReviews = async (serviceRequestId: string): Promise<Review[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.get(`/services/reviews/${serviceRequestId}`);
      return response.data || [];
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erro ao carregar avaliações';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserReviews = async (userId: string): Promise<Review[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.get(`/users/${userId}/reviews`);
      return response.data || [];
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erro ao carregar avaliações do usuário';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    submitReview,
    getServiceReviews,
    getUserReviews,
    isLoading,
    error,
    clearError,
  };
};