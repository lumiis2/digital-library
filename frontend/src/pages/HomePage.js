import {
  ArrowRightIcon,
  BookIcon,
  SearchIcon,
  DownloadIcon,
} from '../components/common/Icons';

const HomePage = ({ onNavigate, totalArticles }) => {
  return (
    <div className="min-h-screen text-branco font-pixel">
      {/* Hero Section */}
      <div className="relative py-20 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold drop-shadow-lg text-branco">
          Bem-vindo à
          <span className="text-neblina block">Digital Library</span>
        </h1>
        <p className="text-base md:text-lg text-branco/90 mt-6 max-w-2xl mx-auto drop-shadow-sm">
          Explore nossa coleção de artigos acadêmicos e científicos.
          Descubra conhecimento de qualidade em diversas áreas do saber.
        </p>

        <div className="flex justify-center mt-8">
          <button
            onClick={() => onNavigate('articles')}
            className="bg-preto hover:bg-neblina text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 shadow-lg border-2 border-cinza"
          >
            <span>Explorar Artigos</span>
            <ArrowRightIcon />
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-branco/90 py-16 border-t border-cinza">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-2xl md:text-3xl font-bold text-azul mb-2">
                {totalArticles || '---'}
              </div>
              <div className="text-preto text-sm md:text-base">Artigos Disponíveis</div>
            </div>
            <div className="p-6">
              <div className="text-2xl md:text-3xl font-bold text-azul mb-2">100%</div>
              <div className="text-preto text-sm md:text-base">Acesso Gratuito</div>
            </div>
            <div className="p-6">
              <div className="text-2xl md:text-3xl font-bold text-azul mb-2">24/7</div>
              <div className="text-preto text-sm md:text-base">Disponibilidade</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-preto/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-neblina drop-shadow-md mb-4">
              Por que escolher nossa biblioteca?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-branco/90 p-6 rounded-xl shadow-lg border border-cinza">
              <div className="w-12 h-12 bg-azul rounded-lg flex items-center justify-center mb-4">
                <BookIcon className="text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-azul mb-2">Conteúdo Curado</h3>
              <p className="text-preto text-sm md:text-base">
                Artigos selecionados e organizados por área de conhecimento para facilitar sua pesquisa.
              </p>
            </div>
            <div className="bg-branco/90 p-6 rounded-xl shadow-lg border border-cinza">
              <div className="w-12 h-12 bg-verde rounded-lg flex items-center justify-center mb-4">
                <SearchIcon className="text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-verde mb-2">Busca Avançada</h3>
              <p className="text-preto text-sm md:text-base">
                Encontre rapidamente o que procura com nossa ferramenta de busca por palavras-chave e área.
              </p>
            </div>
            <div className="bg-branco/90 p-6 rounded-xl shadow-lg border border-cinza">
              <div className="w-12 h-12 bg-neblina rounded-lg flex items-center justify-center mb-4">
                <DownloadIcon className="text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-neblina mb-2">Download Direto</h3>
              <p className="text-preto text-sm md:text-base">
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