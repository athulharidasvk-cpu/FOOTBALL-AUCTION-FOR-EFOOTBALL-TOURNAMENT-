extends Control

@onready var player_name_lbl: Label = $VBox/MainSplit/CardPanel/CardVBox/PlayerName
@onready var player_pos_lbl: Label = $VBox/MainSplit/CardPanel/CardVBox/Position
@onready var player_ovr_lbl: Label = $VBox/MainSplit/CardPanel/CardVBox/Overall
@onready var player_stats_lbl: Label = $VBox/MainSplit/CardPanel/CardVBox/Stats
@onready var current_bid_lbl: Label = $VBox/MainSplit/BiddingPanel/BidVBox/CurrentBid
@onready var highest_bidder_lbl: Label = $VBox/MainSplit/BiddingPanel/BidVBox/HighestBidder
@onready var timer_lbl: Label = $VBox/MainSplit/BiddingPanel/BidVBox/TimerLabel
@onready var log_box: RichTextLabel = $VBox/MainSplit/BiddingPanel/BidVBox/ActivityLog
@onready var user_budget_lbl: Label = $VBox/Header/HBox/UserBudget
@onready var auction_timer: Timer = $AuctionTimer

var current_player_index: int = 0
var current_player: PlayerData
var current_bid: float = 0.0
var highest_bidder: String = "No Bids"
var time_left: int = 15

func _ready() -> void:
	_update_budget_display()
	_nominate_next_player()
	auction_timer.timeout.connect(_on_timer_tick)

func _update_budget_display() -> void:
	if GameManager.user_team:
		user_budget_lbl.text = "Your Budget: ₹%.2f Cr" % GameManager.user_team.budget

func _nominate_next_player() -> void:
	# Find next unsold player
	while current_player_index < Database.all_players.size():
		var p = Database.all_players[current_player_index]
		if not p.is_sold:
			current_player = p
			break
		current_player_index += 1
		
	if not current_player:
		log_box.append_text("[color=yellow]All players in the auction pool have been sold![/color]\n")
		timer_lbl.text = "AUCTION COMPLETE"
		return

	current_bid = current_player.base_price
	highest_bidder = "No Bids"
	time_left = 15
	
	player_name_lbl.text = current_player.name
	player_pos_lbl.text = "Position: %s" % current_player.position
	player_ovr_lbl.text = "OVR: %d" % current_player.rating
	player_stats_lbl.text = "PAC: %d | SHO: %d | PAS: %d" % [current_player.pace, current_player.shooting, current_player.passing]
	
	current_bid_lbl.text = "Current Bid: ₹%.2f Cr" % current_bid
	highest_bidder_lbl.text = "Holding: %s" % highest_bidder
	timer_lbl.text = "⏱️ Time Left: %ds" % time_left
	
	log_box.append_text("[color=cyan]Nominated: %s (Base: ₹%.2f Cr)[/color]\n" % [current_player.name, current_bid])
	auction_timer.start(1.0)

func _on_timer_tick() -> void:
	time_left -= 1
	timer_lbl.text = "⏱️ Time Left: %ds" % time_left
	
	# Random AI bid chance
	if time_left > 3 and randf() < 0.35 and highest_bidder != "Real Madrid" and highest_bidder != "Manchester City":
		_ai_place_bid()
		
	if time_left <= 0:
		auction_timer.stop()
		_hammer_down()

func _ai_place_bid() -> void:
	var ai_teams = ["Real Madrid", "Manchester City", "Bayern Munich", "Barcelona", "Arsenal", "PSG"]
	var bidder = ai_teams[randi() % ai_teams.size()]
	if bidder == highest_bidder:
		return
	var increment = [0.5, 1.0, 1.5][randi() % 3]
	current_bid += increment
	highest_bidder = bidder
	time_left = max(time_left, 6) # Reset timer slightly on competitive bid
	
	current_bid_lbl.text = "Current Bid: ₹%.2f Cr" % current_bid
	highest_bidder_lbl.text = "Holding: %s" % highest_bidder
	log_box.append_text("[color=orange]%s placed bid of ₹%.2f Cr![/color]\n" % [bidder, current_bid])

func place_user_bid(increment: float) -> void:
	if not current_player:
		return
	if GameManager.user_team.budget < (current_bid + increment):
		log_box.append_text("[color=red]Insufficient budget to place bid![/color]\n")
		return
		
	current_bid += increment
	highest_bidder = GameManager.user_team.name
	time_left = max(time_left, 8)
	
	current_bid_lbl.text = "Current Bid: ₹%.2f Cr" % current_bid
	highest_bidder_lbl.text = "Holding: 👑 YOU (%s)" % highest_bidder
	log_box.append_text("[color=green]YOU placed bid of ₹%.2f Cr![/color]\n" % current_bid)

func _hammer_down() -> void:
	if highest_bidder == "No Bids":
		log_box.append_text("[color=gray]Hammer down: %s went UNSOLD.[/color]\n" % current_player.name)
	else:
		log_box.append_text("[b][color=gold]🔨 SOLD! %s to %s for ₹%.2f Cr![/color][/b]\n" % [current_player.name, highest_bidder, current_bid])
		GameManager.purchase_player(current_player, highest_bidder, current_bid)
		_update_budget_display()
		
	current_player_index += 1
	await get_tree().create_timer(2.0).timeout
	_nominate_next_player()

func _on_bid_50l_pressed() -> void:
	place_user_bid(0.5)

func _on_bid_1cr_pressed() -> void:
	place_user_bid(1.0)

func _on_bid_2cr_pressed() -> void:
	place_user_bid(2.0)

func _on_back_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/MainMenu.tscn")
