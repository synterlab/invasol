import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import AuthScreen from "./pages/AuthScreen";
import TitleScreen from "./pages/TitleScreen";
import GameScreen from "./pages/GameScreen";
import ReefShopScreen from "./pages/ReefShopScreen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={AuthScreen} />
        <Route path="/title" component={TitleScreen} />
        <Route path="/game" component={GameScreen} />
        <Route path="/shop" component={ReefShopScreen} />
        <Route component={TitleScreen} />
      </Switch>
    </QueryClientProvider>
  );
}
