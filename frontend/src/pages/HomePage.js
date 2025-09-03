import { ArrowRightIcon, BookIcon, SearchIcon, DownloadIcon } from '../components/common/Icons';

const HomePage = ({ onNavigate, totalArticles }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Bem-vindo à
              <span className="text-blue-600 block">Digital Library</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Explore nossa coleção de artigos acadêmicos e científicos. 
              Descubra conhecimento de qualidade em diversas áreas do saber.
            </p>

            <div className="flex justify-center">
              <button
                onClick={() => onNavigate('articles')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <span>Explorar Artigos</span>
                <ArrowRightIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {totalArticles || '---'}
              </div>
              <div className="text-gray-600">Artigos Disponíveis</div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
              <div className="text-gray-600">Acesso Gratuito</div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">Disponibilidade</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Por que escolher nossa biblioteca?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BookIcon />
              </div>
              <h3 className="text-xl font-semibold mb-2">Conteúdo Curado</h3>
              <p className="text-gray-600">
                Artigos selecionados e organizados por área de conhecimento para facilitar sua pesquisa.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <SearchIcon />
              </div>
              <h3 className="text-xl font-semibold mb-2">Busca Avançada</h3>
              <p className="text-gray-600">
                Encontre rapidamente o que procura com nossa ferramenta de busca por palavras-chave e área.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <DownloadIcon />
              </div>
              <h3 className="text-xl font-semibold mb-2">Download Direto</h3>
              <p className="text-gray-600">
                Acesse os PDFs completos dos artigos com um clique. Simples e rápido.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;