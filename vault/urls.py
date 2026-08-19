from django.urls import path
# from vault.views import RegisterView

from .views import (
    DocumentDeleteView,
    DocumentDownloadView,
    DocumentListCreateView,
    DocumentViewView,
    RegisterView,
)

urlpatterns = [
    path("documents/", DocumentListCreateView.as_view(), name="document-list-create"),
    path(
        "documents/<int:pk>/download/",
        DocumentDownloadView.as_view(),
        name="document-download",
    ),
    path(
        "documents/<int:pk>/view/",
        DocumentViewView.as_view(),
        name="document-view",
    ),
    path(
        "documents/<int:pk>/",
        DocumentDeleteView.as_view(),
        name="document-delete",
    ),
    path("auth/register/", 
         RegisterView.as_view(),
         name="register"),

]