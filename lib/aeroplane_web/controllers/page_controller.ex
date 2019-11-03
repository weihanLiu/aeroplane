defmodule AeroplaneWeb.PageController do
  use AeroplaneWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end

  def game(conn, %{"name" => name, "user" =>user}) do

    render(conn, "game.html", name: name, user: user)
  end
end
