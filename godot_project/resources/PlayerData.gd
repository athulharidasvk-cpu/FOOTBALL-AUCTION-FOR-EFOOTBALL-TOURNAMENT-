class_name PlayerData
extends Resource

@export var id: String = ""
@export var name: String = "Star Player"
@export var position: String = "CF" # GK, CB, LB, RB, DMF, CMF, AMF, LW, RW, CF
@export var rating: int = 85
@export var pace: int = 80
@export var shooting: int = 82
@export var passing: int = 78
@export var defending: int = 45
@export var physical: int = 75
@export var base_price: float = 15.0 # In ₹ Crores
@export var current_club: String = "Free Agent"
@export var nationality: String = "World"
@export var is_sold: bool = false
@export var sold_price: float = 0.0
@export var sold_to: String = ""

func get_formatted_price(amount: float) -> String:
	return "₹%.2f Cr" % amount
