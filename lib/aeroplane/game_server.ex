defmodule Aeroplane.GameServer do
    use GenServer

    def reg(name) do
        {:via, Registry, {Aeroplane.GameReg, name}}
    end

    def start(name) do
        spec = %{
          id: __MODULE__,
          start: {__MODULE__, :start_link, [name]},
          restart: :permanent,
          type: :worker,
        }
        Aeroplane.GameSup.start_child(spec)
    end

    def start_link(name) do
        game = Aeroplane.BackupAgent.get(name) || Aeroplane.Game.new()
        GenServer.start_link(__MODULE__, game, name: reg(name))
    end

    def peek(name) do
        GenServer.call(reg(name), {:peek, name})
    end

    def init(game) do
        {:ok, game}
    end

    def add(name, user) do
        GenServer.call(reg(name), {:add, name, user})
    end

    def on_click_die(name, user) do
        GenServer.call(reg(name), {:on_click_die, name, user})
    end

    def on_click_piece(name, user, index) do
        GenServer.call(reg(name), {:on_click_piece, name, user, index})
    end

    def on_click_join(name, user) do
        GenServer.call(reg(name), {:on_click_join, name, user})
    end

    def on_click_start(name, user) do
        GenServer.call(reg(name), {:on_click_start, name, user})
    end

    def on_click_restart(name, user) do
        GenServer.call(reg(name), {:on_click_restart, name, user})
    end

    def message_submit(name, user, input) do
        GenServer.call(reg(name), {:message_submit, name, user, input})
    end

    def handle_call({:peek, _name}, _from, game) do
        {:reply, game, game}
    end

    def handle_call({:add, name, user}, _from, game) do
        game = Aeroplane.Game.add(game, user)
        Aeroplane.BackupAgent.put(name, game)
        {:reply, game, game}
    end

    def handle_call({:on_click_die, name, user}, _from, game) do
        game = Aeroplane.Game.clickDie(game, user)
        Aeroplane.BackupAgent.put(name, game)
        {:reply, game, game}
    end

    def handle_call({:on_click_piece, name, user, index}, _from, game) do
        game = Aeroplane.Game.clickPiece(game, index, user)
        Aeroplane.BackupAgent.put(name, game|>Enum.at(-1))
        {:reply, game, game|>Enum.at(-1)}
    end

    def handle_call({:on_click_join, name, user}, _from, game) do
        game = Aeroplane.Game.join(game, user)
        Aeroplane.BackupAgent.put(name, game)
        {:reply, game, game}
    end

    def handle_call({:on_click_start, name, user}, _from, game) do
        game = Aeroplane.Game.start(game, user)
        Aeroplane.BackupAgent.put(name, game)
        {:reply, game, game}
    end

    def handle_call({:message_submit, name, user, input}, _from, game) do
        game = Aeroplane.Game.message(game, user, input)
        Aeroplane.BackupAgent.put(name, game)
        {:reply, game, game}
    end

    def handle_call({:on_click_restart, name, user}, _from, game) do
        game = Aeroplane.Game.restart(game, user)
        Aeroplane.BackupAgent.put(name, game)
        {:reply, game, game}
    end
end
