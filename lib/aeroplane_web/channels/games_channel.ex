defmodule AeroplaneWeb.GamesChannel do
    use AeroplaneWeb, :channel
    alias Aeroplane.Game
    alias Aeroplane.GameServer

    def join("games:" <> name, payload, socket) do
      # IO.puts "payload"
      IO.inspect payload

      if authorized?(payload) do
        GameServer.start(name)
        game = GameServer.peek(name)
        game = GameServer.add(name, payload)

        # BackupAgent.put(name, game)
        socket = socket
        |> assign(:name, name)
        |> assign(:user, payload)
        {:ok, %{"join" => name, "game" => Game.client_view(game, payload)}, socket}
      else
        {:error, %{reason: "unauthorized"}}
      end
    end

    def handle_in("on_click_piece", %{"index" => ii}, socket) do
        name = socket.assigns[:name]
        user = socket.assigns[:user]
        game = GameServer.on_click_piece(name, user, ii)
        case game do
          [st1, st2, st3, st4] ->
            broadcast!(socket, "update", %{ "game" => Game.client_view(st1, user) })
            Process.send_after(self(), {:update, st2}, 500)
            Process.send_after(self(), {:update, st3}, 1000)
            Process.send_after(self(), {:update, st4}, 1500)
            {:reply, {:ok, %{ "game" => Game.client_view(st1, user)}}, socket}
          [st1, st2, st3] ->
            broadcast!(socket, "update", %{ "game" => Game.client_view(st1, user) })
            Process.send_after(self(), {:update, st2}, 800)
            Process.send_after(self(), {:update, st3}, 1600)
            {:reply, {:ok, %{ "game" => Game.client_view(st1, user)}}, socket}
          [st1, st2] ->
            broadcast!(socket, "update", %{ "game" => Game.client_view(st1, user) })
            Process.send_after(self(), {:update, st2}, 800)
            {:reply, {:ok, %{ "game" => Game.client_view(st1, user)}}, socket}
          [st1] ->
            broadcast!(socket, "update", %{ "game" => Game.client_view(st1, user) })
            {:reply, {:ok, %{ "game" => Game.client_view(st1, user)}}, socket}
        end
    end

    def handle_in("on_click_die", %{}, socket) do
      name = socket.assigns[:name]
      user = socket.assigns[:user]
      game = GameServer.on_click_die(name, user)
      broadcast!(socket, "update", %{ "game" => Game.client_view(game, user) })
      {:reply, {:ok, %{ "game" => Game.client_view(game, user)}}, socket}
    end

    def handle_in("on_click_join", %{}, socket) do
      IO.puts "channel on_click_join"
      name = socket.assigns[:name]
      user = socket.assigns[:user]
      game = GameServer.on_click_join(name, user)
      broadcast!(socket, "update", %{ "game" => Game.client_view(game, user) })
      {:reply, {:ok, %{ "game" => Game.client_view(game, user)}}, socket}
    end

    def handle_in("on_click_start", %{}, socket) do
      IO.puts "channel on_click_start"
      name = socket.assigns[:name]
      user = socket.assigns[:user]
      game = GameServer.on_click_start(name, user)
      broadcast!(socket, "update", %{ "game" => Game.client_view(game, user) })
      {:reply, {:ok, %{ "game" => Game.client_view(game, user)}}, socket}
    end

    def handle_in("message_submit", %{"msg" => input}, socket) do
      IO.puts "channel message submit"
      name = socket.assigns[:name]
      user = socket.assigns[:user]
      game = GameServer.message_submit(name, user, input)
      broadcast!(socket, "update", %{ "game" => Game.client_view(game, user) })
      {:reply, {:ok, %{ "game" => Game.client_view(game, user)}}, socket}
    end

    def handle_in("on_click_restart", %{}, socket) do
      IO.puts "channel click restart"
      name = socket.assigns[:name]
      user = socket.assigns[:user]
      game = GameServer.on_click_restart(name, user)
      broadcast!(socket, "update", %{ "game" => Game.client_view(game, user) })
      {:reply, {:ok, %{ "game" => Game.client_view(game, user)}}, socket}
    end

    def handle_info({:update, game}, socket) do
      user = socket.assigns[:user]
      broadcast!(socket, "update", %{ "game" => Game.client_view(game, user) })
      {:noreply, socket}
    end

    # Add authorization logic here as required.
    defp authorized?(_payload) do
      true
    end
  end