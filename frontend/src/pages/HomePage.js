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

      {/* Stats Section (transparent card-like) */}
      <div className="flex justify-center -mt-8">
        <div className="w-full max-w-5xl bg-white/85 backdrop-blur-sm rounded-xl border border-white/30 px-6 py-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg md:text-2xl font-medium text-azul">{totalArticles || '---'}</div>
              <div className="text-preto text-xs md:text-sm">Artigos Disponíveis</div>
            </div>
            <div>
              <div className="text-lg md:text-2xl font-medium text-azul">100%</div>
              <div className="text-preto text-xs md:text-sm">Acesso Gratuito</div>
            </div>
            <div>
              <div className="text-lg md:text-2xl font-medium text-azul">24/7</div>
              <div className="text-preto text-xs md:text-sm">Disponibilidade</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section (transparent container with white border like nav) */}
      <div className="py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-transparent border border-white/30 rounded-lg px-6 py-6 backdrop-blur-sm">
            <div className="text-center mb-4">
              <h2 className="text-lg md:text-xl font-medium text-neblina">Por que escolher nossa biblioteca?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-md">
                <div className="w-10 h-10 bg-azul rounded-md flex items-center justify-center mb-2">
                  <BookIcon className="text-white text-sm" />
                </div>
                <h3 className="text-sm font-medium text-azul mb-1">Conteúdo Curado</h3>
                <p className="text-preto text-xs">Artigos selecionados e organizados por área de conhecimento.</p>
              </div>
              <div className="p-3 rounded-md">
                <div className="w-10 h-10 bg-verde rounded-md flex items-center justify-center mb-2">
                  <SearchIcon className="text-white text-sm" />
                </div>
                <h3 className="text-sm font-medium text-verde mb-1">Busca Avançada</h3>
                <p className="text-preto text-xs">Encontre rapidamente o que procura com nossa ferramenta de busca.</p>
              </div>
              <div className="p-3 rounded-md">
                <div className="w-10 h-10 bg-neblina rounded-md flex items-center justify-center mb-2">
                  <DownloadIcon className="text-white text-sm" />
                </div>
                <h3 className="text-sm font-medium text-neblina mb-1">Download Direto</h3>
                <p className="text-preto text-xs">Acesse os PDFs completos dos artigos com um clique.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;