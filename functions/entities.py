import azure.durable_functions as df
import logging
import json

@df.entity_function
def QuotaEntity(context: df.DurableEntityContext):
    """Durable Entity for managing tenant quotas"""
    
    current_state = context.state or {"inflight": 0, "limit": 10}
    
    operation = context.operation_name
    
    if operation == "try_acquire":
        if current_state["inflight"] < current_state["limit"]:
            current_state["inflight"] += 1
            context.set_state(current_state)
            context.set_result({"success": True, "inflight": current_state["inflight"]})
            logging.info(f"Quota acquired. Current inflight: {current_state['inflight']}")
        else:
            context.set_result({"success": False, "inflight": current_state["inflight"], "limit": current_state["limit"]})
            logging.warning(f"Quota limit reached. Inflight: {current_state['inflight']}, Limit: {current_state['limit']}")
    
    elif operation == "release":
        if current_state["inflight"] > 0:
            current_state["inflight"] -= 1
            context.set_state(current_state)
            logging.info(f"Quota released. Current inflight: {current_state['inflight']}")
        context.set_result({"inflight": current_state["inflight"]})
    
    elif operation == "set_limit":
        new_limit = context.get_input()
        current_state["limit"] = new_limit
        context.set_state(current_state)
        context.set_result({"limit": current_state["limit"], "inflight": current_state["inflight"]})
        logging.info(f"Quota limit set to {new_limit}")
    
    elif operation == "get_state":
        context.set_result(current_state)
    
    else:
        logging.warning(f"Unknown operation: {operation}")
        context.set_result({"error": f"Unknown operation: {operation}"})
