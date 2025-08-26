import React from 'react';

const LoadingSpinner = ({ message = "Carregando..." }) => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">{message}</span>
  </div>
);

export default LoadingSpinner;