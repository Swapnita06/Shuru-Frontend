import autogen

config_file_path = "OAI_CONFIG_LIST.json" 

config_list = autogen.config_list_from_json(
    config_file_path
)

llm_config = {"config_list": config_list, "cache_seed": 49}
user_proxy = autogen.UserProxyAgent(
    name="User_proxy",
    system_message="A human admin.",
    code_execution_config={
        "last_n_messages": 2,
        "work_dir": "groupchat",
        "use_docker": False,
    },  # Please set use_docker=True if docker is available to run the generated code. Using docker is safer than running the generated code directly.
    human_input_mode="TERMINATE",
)


planner = autogen.AssistantAgent(
    name="Planner",
    system_message="""Planner. Suggest a plan. Revise the plan based on feedback from admin and critic, until admin approval.
The plan may involve an engineer who can write code and a scientist who doesn't write code.
Explain the plan first. Be clear which step is performed by an engineer, and which step is performed by a scientist.
""",
    llm_config=llm_config,
)

user_proxy = autogen.UserProxyAgent(
    name="Admin",
    system_message="A human admin. Interact with the planner to discuss the plan. Plan execution needs to be approved by this admin.",
    code_execution_config=False,
)

engineer = autogen.AssistantAgent(
    name="Engineer",
    llm_config=llm_config,
    system_message="""Engineer. You follow an approved plan. You write python/shell code to solve tasks. Wrap the code in a code block that specifies the script type. The user can't modify your code. So do not suggest incomplete code which requires others to modify. Don't use a code block if it's not intended to be executed by the executor.
Don't include multiple code blocks in one response. Do not ask others to copy and paste the result. Check the execution result returned by the executor.
If the result indicates there is an error, fix the error and output the code again. Suggest the full code instead of partial code or code changes. If the error can't be fixed or if the task is not solved even after the code is executed successfully, analyze the problem, revisit your assumption, collect additional info you need, and think of a different approach to try.
""",
)
scientist = autogen.AssistantAgent(
    name="Scientist",
    llm_config=llm_config,
    system_message="""Scientist. You follow an approved plan. You are able to categorize papers after seeing their abstracts printed. You don't write code.""",
)

executor = autogen.UserProxyAgent(
    name="Executor",
    system_message="Executor. Execute the code written by the engineer and report the result.",
    human_input_mode="NEVER",
    code_execution_config={
        "last_n_messages": 3,
        "work_dir": "paper",
        "use_docker": False,
    },  # Please set use_docker=True if docker is available to run the generated code. Using docker is safer than running the generated code directly.
)

from typing import Dict, List

from autogen import Agent


def custom_speaker_selection_func(last_speaker: Agent, groupchat: autogen.GroupChat):
    """Define a customized speaker selection function.
    A recommended way is to define a transition for each speaker in the groupchat.

    Returns:
        Return an `Agent` class or a string from ['auto', 'manual', 'random', 'round_robin'] to select a default method to use.
    """
    messages = groupchat.messages

    if len(messages) <= 1:
        return planner

    if last_speaker is user_proxy:
        if "Approve" in messages[-1]["content"]:
            # If the last message is approved, let the engineer to speak
            return engineer
        elif messages[-2]["name"] == "Planner":
            # If it is the planning stage, let the planner to continue
            return planner
        elif messages[-2]["name"] == "Scientist":
            # If the last message is from the scientist, let the scientist to continue
            return scientist

    elif last_speaker is planner:
        # Always let the user to speak after the planner
        return user_proxy

    elif last_speaker is engineer:
        if "```python" in messages[-1]["content"]:
            # If the last message is a python code block, let the executor to speak
            return executor
        else:
            # Otherwise, let the engineer to continue
            return engineer

    elif last_speaker is executor:
        if "exitcode: 1" in messages[-1]["content"]:
            # If the last message indicates an error, let the engineer to improve the code
            return engineer
        else:
            # Otherwise, let the scientist to speak
            return scientist

    elif last_speaker is scientist:
        # Always let the user to speak after the scientist
        return user_proxy

    else:
        return "random"


groupchat = autogen.GroupChat(
    agents=[user_proxy, engineer, scientist, planner, executor],
    messages=[],
    max_round=5,
    speaker_selection_method=custom_speaker_selection_func,
)
manager = autogen.GroupChatManager(groupchat=groupchat, llm_config=llm_config)

user_proxy.initiate_chat(
    manager, message="Find a paper about block chain and find its potential applications in software."
)
# type exit to terminate the chat