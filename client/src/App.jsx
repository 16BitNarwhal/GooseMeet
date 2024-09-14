
import Header from './components/Header';
import VideoFeed from './components/VideoFeed';

function App() {
  return (
    <div className="relative h-screen flex">
      <div className="flex flex-col w-3/4 pt-8 h-full">
        <Header />
        <div className="flex-grow">
          <VideoFeed />
        </div>
        {/* <Footer /> */}
      </div>

      <div className="absolute right-0 top-0 h-full w-1/4 border-l p-4 border-neutral-800">
        <div className="h-full overflow-y-auto">
        </div>
      </div>
    </div>
  );
}

export default App;