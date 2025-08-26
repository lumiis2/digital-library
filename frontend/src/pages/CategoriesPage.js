import React from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CategoryCard from '../components/cards/CategoryCard';

const CategoriesPage = ({ data: categories, loading, error, onNavigate }) => {
  if (loading) return <LoadingSpinner message="Carregando categorias..." />;
  if (error) return <div className="text-center py-12 text-red-600">Erro: {error}</div>;

  const handleCategoryClick = (category) => {
    // Navigate to articles filtered by this category
    onNavigate('articles', { filterBy: 'area', filterValue: category.nome || category.area });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Categorias</h1>
          <p className="text-gray-600">
            Explore as {categories.length} áreas de conhecimento disponíveis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryCard 
              key={category.id || category.nome} 
              category={category}
              onClick={handleCategoryClick}
            />
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nenhuma categoria encontrada.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;