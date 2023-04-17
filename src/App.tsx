import { BrowserRouter as Router, Route } from 'react-router-dom';

import Index from './pages/Index';

import SnackBar from 'components/SnackBar';
import ConfirmDialog from './components/ConfirmDialog';

import { StoreProvider } from './store';

import { AiOutlineGithub } from 'react-icons/ai';

const AppRouter = () => {
  return (
    <StoreProvider>
      <Router>
        <div>
          <Route path="/" component={Index} />
          <SnackBar />
          <ConfirmDialog />

          <div className="fixed bottom-10 right-10">
            <a className="mt-5 p-3 text-gray-70 text-13 cursor-pointer" target="_blank" rel="noreferrer" href="https://github.com/okdaodine/rum-chat-html">
              <AiOutlineGithub className="text-46" />
            </a>
          </div>
        </div>
      </Router>
    </StoreProvider>
  );
};

export default AppRouter;
