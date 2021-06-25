class ChessGame {
  constructor() {
    this.players = [];
    this.currentPlayerIndex = 0;
    this.winner = '';
  }

  setPlayers(player) {
    if (this.players.length < 2) {
      this.players.push(player);
    }
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  setCurrentPlayer() {
    this.currentPlayerIndex = this.currentPlayerIndex === 0 ? 1 : 0;
  }

  changePlayer(player, coords) {
    if (this.players.length === 2) {
      if (!this.winner) {
        console.log('inside');
        if (player === this.players[this.currentPlayerIndex]) {
          
          // this.field[coords.y][coords.x] = this.signs[this.currentPlayerIndex];
          // this.checkWinner(coords, this.signs[this.currentPlayerIndex]);
          // this.currentSign = this.signs[this.currentPlayerIndex];
          this.setCurrentPlayer();
        }
      }
    }
  }

}

module.exports = { ChessGame };