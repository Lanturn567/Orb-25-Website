# models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    max_score = models.IntegerField(default=0)
    date_joined = models.DateTimeField(auto_now_add=True)

    # Add password validators
    password = models.CharField(
        max_length=16,
        validators=[MinLengthValidator(8)]
    )

    def __str__(self):
        return self.username

    class Meta:
        ordering = ['-max_score']