
import Header from './components/Header';
import VideoFeed from './components/VideoFeed';

function App() {
  return (
    <div className="relative h-screen flex bg-white dark:bg-neutral-900">
      <div className="flex flex-col w-4/5 pt-8 h-full">
        <Header />
        <div className="flex-grow">
          <VideoFeed />
        </div>
        {/* <Footer /> */}
      </div>

      <div className="absolute right-0 top-0 h-full w-1/5 border-l p-4 border-neutral-200 dark:border-neutral-800">
        <div className="h-full overflow-y-auto">
        </div>
      </div>
    </div>
  );
}

export default App;