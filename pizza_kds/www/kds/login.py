import frappe

no_cache = 1


def get_context(context):
    context.no_cache = 1
    context.title = "KDS Login"
    context.show_sidebar = False
    context.body_class = "kds-website-route"
    if frappe.session.user != "Guest":
        context.boot = getattr(context, "boot", frappe._dict())
